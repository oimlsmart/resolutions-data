# frozen_string_literal: true

# OCR OIML resolution PDFs via z.ai GLM-OCR (layout parsing).
#
# Adapted from ~/src/relaton/relaton-data-oiml/backfill/glm_ocr.rb with
# three changes only:
#   1. PAGES_PER_CHUNK 30 → 100  (current API limit)
#   2. http.read_timeout 180 → 600  (bigger chunks need longer parse time)
#   3. CACHE_DIR points at reference-docs/.ocr/raw in this repo
#
# Limits: PDF <= 100 MB, <= 100 pages per request.
# API: POST https://api.z.ai/api/paas/v4/layout_parsing
#   body: { model: "glm-ocr", file: <url|base64>, start_page_id:, end_page_id: }
#
# Output:
#   reference-docs/.ocr/raw/<sha(input,start,end)>.json  (full API response)
#   reference-docs/.ocr/md/<slug>.md                     (concatenated, per source PDF)
#
# Run via scripts/ocr/run.rb — see TODO.work/04-ocr-adapt.md.

require "net/http"
require "json"
require "digest"
require "fileutils"
require "base64"

module ResolutionsData
  class GlmOcr
    ENDPOINT = URI("https://api.z.ai/api/paas/v4/layout_parsing").freeze
    PAGES_PER_CHUNK = 100
    CACHE_DIR = File.expand_path("../../reference-docs/.ocr/raw", __dir__)
    MAX_BYTES = 100 * 1024 * 1024 # 100 MB

    DEFAULT_KEY_FILE = File.expand_path("~/.zai-api-key")

    def initialize(api_key: nil)
      @api_key = api_key || ENV["Z_AI_API_KEY"] || read_key_file(DEFAULT_KEY_FILE)
      raise "Z_AI_API_KEY not set and #{DEFAULT_KEY_FILE} not found" unless @api_key
      FileUtils.mkdir_p(CACHE_DIR)
    end

    # Handles both raw-key files and `export VAR=value` snippet files.
    def read_key_file(path)
      contents = File.read(path).strip
      return contents unless contents =~ /\Aexport\s+(\w+)=(.+)\z/m
      Regexp.last_match(2).strip.gsub(/\A["']|["']\z/, "")
    end

    # OCR an entire PDF by chunking into 100-page windows. Returns combined
    # markdown. Caches each chunk by (input, window) so re-runs are free.
    def ocr_pdf(file_input, num_pages:)
      raise "input exceeds 100 MB limit" if file_size_bytes(file_input) > MAX_BYTES
      chunks = []
      (1..num_pages).each_slice(PAGES_PER_CHUNK).each do |window|
        start_page = window.first
        end_page   = [window.last, num_pages].min
        chunks << chunk(file_input, start_page, end_page)
      end
      chunks.join("\n\n<!-- page-break -->\n\n")
    end

    # Single chunk. file_input is a URL string or local path.
    def chunk(file_input, start_page, end_page)
      cache_key = cache_key_for(file_input, start_page, end_page)
      cached = read_cache(cache_key)
      if cached
        warn "  cache hit  pages #{start_page}-#{end_page} of #{describe(file_input)}"
        return cached["md_results"] || ""
      end

      res = request(file_input, start_page, end_page)
      write_cache(cache_key, res)
      warn "  OCR        #{describe(file_input)} pages #{start_page}-#{end_page}: #{res.dig('usage', 'total_tokens')} tokens"
      res["md_results"] || ""
    end

    private

    def file_size_bytes(input)
      return -1 if input.start_with?("http")
      File.size(input)
    rescue Errno::ENOENT
      -1
    end

    def request(file_input, start_page, end_page)
      body = { "model" => "glm-ocr",
               "file" => as_file_field(file_input),
               "start_page_id" => start_page,
               "end_page_id"   => end_page }
      http = Net::HTTP.new(ENDPOINT.host, ENDPOINT.port)
      http.use_ssl = true
      http.read_timeout = 600
      http.open_timeout = 30
      req = Net::HTTP::Post.new(ENDPOINT.request_uri,
                                "Authorization" => "Bearer #{@api_key}",
                                "Content-Type"  => "application/json")
      req.body = JSON.generate(body)

      res = nil
      3.times do |attempt|
        res = http.request(req)
        break if res.is_a?(Net::HTTPSuccess) || res.code.to_i.between?(400, 499)
        warn "  API retry #{attempt + 1}/3: HTTP #{res.code}" if attempt < 2
        sleep(2 ** attempt)
      end
      raise "GLM-OCR HTTP #{res.code}: #{res.body[0, 300]}" unless res.is_a?(Net::HTTPSuccess)

      JSON.parse(res.body).tap do |j|
        raise "GLM-OCR error: #{j.inspect}" if j["error"] || (j["code"] && j["code"] != 200)
      end
    end

    def as_file_field(input)
      return input if input.start_with?("http")
      "data:application/pdf;base64,#{Base64.strict_encode64(File.binread(input))}"
    end

    def describe(input) = input.start_with?("http") ? input : File.basename(input)

    def cache_key_for(input, start_page, end_page)
      Digest::SHA256.hexdigest("#{input}|#{start_page}|#{end_page}")[0, 16]
    end

    def read_cache(key)
      path = File.join(CACHE_DIR, "#{key}.json")
      return nil unless File.exist?(path)
      JSON.parse(File.read(path))
    end

    def write_cache(key, data)
      File.write(File.join(CACHE_DIR, "#{key}.json"), JSON.generate(data))
    end
  end
end

if $PROGRAM_NAME == __FILE__
  input = ARGV[0] || abort("usage: glm_ocr.rb <pdf_url_or_path> [<num_pages>] [<slug>]")
  num_pages = (ARGV[1] || 1).to_i
  slug      = ARGV[2] || (input.start_with?("http") ? "remote" : File.basename(input, ".pdf"))
  md        = ResolutionsData::GlmOcr.new.ocr_pdf(input, num_pages: num_pages)

  out_dir = File.expand_path("../../reference-docs/.ocr/md", __dir__)
  FileUtils.mkdir_p(out_dir)
  out = File.join(out_dir, "#{slug}.md")
  File.write(out, md)
  puts "Wrote #{out} (#{md.size} chars)"
end
