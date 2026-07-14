#!/usr/bin/env ruby
# frozen_string_literal: true

# Download every PDF listed in scripts/manifest.yaml into
# reference-docs/{ciml,conferences}/<slug>.pdf. Idempotent: skips files that
# already exist and parse as valid PDFs.

require "net/http"
require "yaml"
require "fileutils"
require "open3"

module ResolutionsData
  MODULE_DIR = File.expand_path(__dir__)
  ROOT       = File.expand_path("..", MODULE_DIR)
  MANIFEST   = File.join(MODULE_DIR, "manifest.yaml")
  REF_DIR    = File.join(ROOT, "reference-docs")

  module Fetch
    RETRIES    = 3
    USER_AGENT = "oiml-resolutions/1.0 (+archive)"

    def self.run
      sources = YAML.load_file(MANIFEST)["sources"]
      stats = Hash.new(0)

      sources.each do |src|
        kind_dir =
          case src["kind"]
          when "ciml"        then "ciml"
          when "conference"  then "conferences"
          else raise "unknown kind #{src["kind"].inspect}"
          end
        dest = File.join(REF_DIR, kind_dir, "#{src["slug"]}.pdf")

        if File.exist?(dest) && valid_pdf?(dest)
          stats[:cached] += 1
          puts "  cached   #{src['slug']}"
          next
        end

        begin
          bytes = download(src["url"], dest)
          stats[:downloaded] += 1
          puts "  fetched  #{src['slug']}  (#{format_bytes(bytes)})"
        rescue => e
          stats[:error] += 1
          warn "  ERROR    #{src['slug']}: #{e.message}"
        end
      end

      total_bytes = Dir.glob(File.join(REF_DIR, "{ciml,conferences}", "*.pdf"))
                       .sum { |p| File.size(p) }
      puts
      puts "Summary: #{stats[:downloaded]} downloaded, #{stats[:cached]} cached, #{stats[:error]} errors"
      puts "Total archive: #{format_bytes(total_bytes)} across #{Dir.glob(File.join(REF_DIR, '{ciml,conferences}', '*.pdf')).size} files"
      exit 1 if stats[:error] > 0
    end

    def self.valid_pdf?(path)
      return false if File.size(path) < 1024
      File.binread(path, 5) == "%PDF-"
    end

    def self.download(url, dest)
      FileUtils.mkdir_p(File.dirname(dest))
      tmp   = "#{dest}.tmp"
      uri   = URI(url)
      bytes = 0

      (1..RETRIES).each do |attempt|
        Net::HTTP.start(uri.host, uri.port,
                        use_ssl: uri.scheme == "https",
                        read_timeout: 120, open_timeout: 30) do |http|
          req = Net::HTTP::Get.new(uri.request_uri,
                                   "user-agent" => USER_AGENT,
                                   "accept" => "application/pdf")
          res = http.request(req)
          unless res.is_a?(Net::HTTPSuccess)
            raise "HTTP #{res.code} #{res.message} for #{url}"
          end
          File.binwrite(tmp, res.body)
          bytes = res.body.bytesize
        end
        break
      rescue => e
        FileUtils.rm_f(tmp)
        raise if attempt == RETRIES
        warn "  retry #{attempt}/#{RETRIES} for #{File.basename(dest)}: #{e.class}: #{e.message}"
        sleep(2 ** (attempt - 1))
      end

      raise "downloaded file is not a valid PDF: #{tmp}" unless valid_pdf?(tmp)
      File.rename(tmp, dest)
      bytes
    end

    def self.format_bytes(n)
      return "0 B" if n.nil? || n.zero?
      units = %w[B KB MB GB]
      i = (Math.log(n) / Math.log(1024)).to_i
      i = units.size - 1 if i >= units.size
      format("%.1f %s", n.to_f / (1024 ** i), units[i])
    end
  end
end

ResolutionsData::Fetch.run if $PROGRAM_NAME == __FILE__
