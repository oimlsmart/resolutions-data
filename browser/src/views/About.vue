<template>
  <div class="std-page about-page">
    <!-- Back link -->
    <button @click="$router.back()" class="back-link animate-up" style="--nth: 1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="back-link__icon"><path d="m15 18-6-6 6-6"/></svg>
      Back
    </button>

    <!-- 1. Hero / Header -->
    <header class="about-header animate-up" style="--nth: 2">
      <h1 class="about-title">{{ t('about.heroTitle') }}</h1>
      <p class="about-subtitle">{{ t('about.heroSubtitle') }}</p>
    </header>

    <!-- Content Sections -->
    <div class="about-content">

      <!-- 3. Action Types -->
      <section class="about-section animate-up" style="--nth: 4">
        <h2 class="about-heading">Action Types</h2>
        <div class="about-body">
          <p>
            Every resolution is composed of typed <code>actions</code> that categorize what the committee decided to do (e.g., requesting an action, approving a document, or thanking a host). This semantic typing allows for advanced filtering and analysis of the committee's historical activities.
          </p>
          <div class="action-grid">
            <span 
              v-for="chip in actionChips" 
              :key="chip.type"
              class="action-chip"
              :style="{ '--chip-bg': chip.bg, '--chip-text': chip.text }"
            >
              {{ chip.type }}
            </span>
          </div>
        </div>
      </section>

      <!-- 6. About the Committee -->
      <section class="about-section animate-up" style="--nth: 7">
        <h2 class="about-heading">{{ t('about.aboutCommittee') }}</h2>
        <div class="about-body">
          <div class="committee-card">
            <h3 class="committee-title">{{ t('committee.title') }}</h3>
            <p class="committee-scope">{{ t('committee.scope') }}</p>
            
            <div class="committee-stats">
              <div class="stat-item">
                <span class="stat-value">{{ committee.established }}</span>
                <span class="stat-label">Established</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ committee.memberStates }}</span>
                <span class="stat-label">Member States</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ committee.correspondingMembers }}</span>
                <span class="stat-label">Corresponding Members</span>
              </div>
            </div>

            <div class="committee-links">
              <a :href="committee.links.oiml" target="_blank" rel="noopener noreferrer" class="committee-link">
                Official website
              </a>
              <a href="https://www.oiml.org/en/structure/members/memberslist_view?varMember=1" target="_blank" rel="noopener noreferrer" class="committee-link">
                Member States
              </a>
              <a :href="committee.links.github" target="_blank" rel="noopener noreferrer" class="committee-link">
                GitHub Organization
              </a>
              <a :href="committee.links.linkedin" target="_blank" rel="noopener noreferrer" class="committee-link">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      
      <!-- Technical Information (collapsed by default) -->
      <section class="about-section about-section--technical animate-up" style="--nth: 8">
        <details class="technical-details">
          <summary class="about-heading technical-summary">{{ t('about.technical') }}</summary>
          <div class="technical-body">

            <h3 class="technical-subheading">{{ t('about.edoxen') }}</h3>
            <div class="technical-content">
        <div class="about-body">
          <p>
            Resolutions in this archive are stored in plain-text YAML files using the <strong>Edoxen format</strong>. This structured representation ensures resolutions remain human-readable while being entirely machine-parsable.
          </p>
          <div class="code-wrapper">
            <pre class="code-block"><code><span class="code-key">metadata</span>:
  <span class="code-key">title</span>: <span class="code-string">Resolutions of the 17th OIML Conference, Paris, France</span>
  <span class="code-key">dates</span>:
  - <span class="code-key">start</span>: <span class="code-string">'2024-10-18'</span>
    <span class="code-key">end</span>: <span class="code-string">'2024-10-25'</span>
    <span class="code-key">kind</span>: <span class="code-string">meeting</span>
  <span class="code-key">source</span>: <span class="code-string">OIML Conference Secretariat (BIML)</span>
  <span class="code-key">venue</span>: <span class="code-string">Paris, France</span>

<span class="code-key">resolutions</span>:
- <span class="code-key">identifier</span>: <span class="code-string">Conference/2025/01</span>
  <span class="code-key">subject</span>: <span class="code-string">OIML Conference</span>
  <span class="code-key">title</span>: <span class="code-string">Approves the agenda for the 17th International Conference on Legal Metrology</span>
  <span class="code-key">dates</span>:
  - <span class="code-key">start</span>: <span class="code-string">'2024-10-15'</span>
    <span class="code-key">kind</span>: <span class="code-string">decision</span>
  <span class="code-key">actions</span>:
  - <span class="code-key">type</span>: <span class="code-string">approves</span>
    <span class="code-key">message</span>: |<span class="code-string">
      Approves the agenda for the 17th International Conference
      on Legal Metrology (OIML Conference).</span>
  <span class="code-key">considerations</span>:
  - <span class="code-key">type</span>: <span class="code-string">noting</span>
    <span class="code-key">message</span>: |<span class="code-string">
      Approves the agenda for the 17th International Conference...</span>
  <span class="code-key">approvals</span>:
  - <span class="code-key">degree</span>: <span class="code-string">unanimous</span>
    <span class="code-key">message</span>: <span class="code-string">Approved without objection</span></code></pre>
          </div>
          <p>
            Each file contains two main sections: <code>metadata</code>, containing information about the meeting, and a <code>resolutions</code> array, detailing the individual decisions made. A resolution includes its identifier, subject, title, relevant dates, any context under <code>considerations</code>, and the <code>actions</code> mandated by the committee.
          </p>
          <p>
            <a href="https://github.com/metanorma/edoxen" target="_blank" rel="noopener noreferrer" class="text-link">View the Edoxen schema on GitHub &rarr;</a>
          </p>
        </div>
            </div>


            <h3 class="technical-subheading">{{ t('about.lifecycle') }}</h3>
            <div class="technical-content">
              <p>
                Each resolution in the Edoxen model follows a structured lifecycle, captured through three interconnected sections:
              </p>
              <div class="lifecycle-list">
                <div class="lifecycle-item">
                  <div class="lifecycle-number">1</div>
                  <div class="lifecycle-content">
                    <h3 class="lifecycle-title">Considerations</h3>
                    <p class="lifecycle-desc">The context and background that led to the resolution. Each consideration has a type (e.g., <code class="inline-code">noting</code>, <code class="inline-code">recalling</code>, <code class="inline-code">recognising</code>) and a message explaining what the committee observed or referenced.</p>
                  </div>
                </div>
                <div class="lifecycle-item">
                  <div class="lifecycle-number">2</div>
                  <div class="lifecycle-content">
                    <h3 class="lifecycle-title">Actions</h3>
                    <p class="lifecycle-desc">The decisions themselves — what the committee resolved to do. Each action carries a semantic type (e.g., <code class="inline-code">requests</code>, <code class="inline-code">approves</code>, <code class="inline-code">appoints</code>) that categorizes the nature of the decision, along with the detailed message.</p>
                  </div>
                </div>
                <div class="lifecycle-item">
                  <div class="lifecycle-number">3</div>
                  <div class="lifecycle-content">
                    <h3 class="lifecycle-title">Approvals</h3>
                    <p class="lifecycle-desc">How the resolution was formally adopted, including the degree of consensus (e.g., <code class="inline-code">unanimous</code>, <code class="inline-code">consensus</code>) and any relevant notes about the approval process.</p>
                  </div>
                </div>
              </div>
              <p>
                A single resolution may contain multiple considerations, actions, and approvals — together forming a complete record of the committee's decision-making process.
              </p>
            </div>

            <h3 class="technical-subheading">{{ t('about.urnPattern') }}</h3>
            <div class="technical-content">
              <p>
                Every resolution is assigned a Uniform Resource Name following
                the OIML URN specification, format
                <code>urn:oiml:doc:&lt;body&gt;:resolution:&lt;id&gt;</code>.
              </p>
              <ul class="urn-list">
                <li>
                  <strong>CIML resolutions:</strong>
                  <code>urn:oiml:doc:ciml:resolution:&lt;year&gt;-&lt;seq&gt;</code>
                  <br><span class="urn-example">Example: <code>urn:oiml:doc:ciml:resolution:2025-44</code></span>
                </li>
                <li>
                  <strong>Conference resolutions:</strong>
                  <code>urn:oiml:doc:conf:resolution:&lt;session&gt;.&lt;seq&gt;</code>
                  <br><span class="urn-example">Example: <code>urn:oiml:doc:conf:resolution:17.01</code></span>
                </li>
              </ul>
            </div>

            <h3 class="technical-subheading">{{ t('about.doiPattern') }}</h3>
            <div class="technical-content">
              <p>
                Every resolution is registered with a DOI under the
                <code>10.63493/resolutions/</code> prefix, resolved via
                <a href="https://doi.org" target="_blank" rel="noopener noreferrer">doi.org</a>.
              </p>
              <ul class="urn-list">
                <li>
                  <strong>CIML:</strong>
                  <code>10.63493/resolutions/ciml&lt;YYYY&gt;&lt;NN&gt;</code>
                  <br><span class="urn-example">Example: <code>10.63493/resolutions/ciml202544</code> &rarr;
                    <a href="https://doi.org/10.63493/resolutions/ciml202544" target="_blank" rel="noopener noreferrer">doi.org/10.63493/resolutions/ciml202544</a>
                  </span>
                </li>
                <li>
                  <strong>Conference:</strong>
                  <code>10.63493/resolutions/conf&lt;YYYY&gt;&lt;NN&gt;</code>
                  <br><span class="urn-example">Example: <code>10.63493/resolutions/conf202501</code> &rarr;
                    <a href="https://doi.org/10.63493/resolutions/conf202501" target="_blank" rel="noopener noreferrer">doi.org/10.63493/resolutions/conf202501</a>
                  </span>
                </li>
              </ul>
              <p>
                <code>&lt;YYYY&gt;</code> is the four-digit meeting year;
                <code>&lt;NN&gt;</code> is the zero-padded per-meeting sequence.
              </p>
            </div>

          </div>
        </details>
      </section>

</section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { committee } from '../data/committee'
import { useI18n } from '../composables/useI18n'
import { getActionColor } from '../data/actionTypes'

const { t } = useI18n()

// Top action types by frequency (from data analysis)
const actionTypes = [
  'requests', 'thanks', 'appoints', 'approves', 'resolves', 'directs',
  'asks', 'encourages', 'accepts', 'instructs', 'nominates', 'decides',
  'agrees', 'adopts', 'establishes', 'welcomes', 'creates', 'recommends',
  'endorses', 'notes', 'recognizes', 'confirms', 'appreciation', 'allocates',
  'supports', 'disbands', 'acknowledges', 'assigns', 'appreciates'
]

// Compute colors for display
const actionChips = actionTypes.map(type => ({
  type,
  ...getActionColor(type)
}))
</script>

<style scoped>
/* Animations */
.animate-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--nth) * 0.1s);
}

.about-page {
  max-width: 56rem;
  margin: 0 auto;
  padding-bottom: 4rem;
}

/* Back Link */
.back-link {
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate-500);
  transition: color 0.2s;
  padding: 0;
  margin-bottom: 2rem;
}
.back-link:hover,
.back-link:focus-visible {
  color: var(--color-blue-accent);
  outline: none;
}
.dark .back-link:hover,
.dark .back-link:focus-visible {
  color: #66a3e0;
}
.back-link__icon {
  transition: transform 0.2s;
}
.back-link:hover .back-link__icon {
  transform: translateX(-4px);
}

/* Header */
.about-header {
  margin-bottom: 4rem;
}

.about-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--color-slate-900);
  line-height: 1.2;
  margin-bottom: 1rem;
}
@media (min-width: 768px) {
  .about-title { font-size: 2.75rem; }
}
@media (min-width: 1024px) {
  .about-title { font-size: 3.5rem; }
}
.dark .about-title { color: white; }

.about-subtitle {
  font-size: 1.125rem;
  color: var(--color-slate-500);
  font-style: italic;
  padding-left: 1rem;
  border-left: 2px solid var(--color-slate-200);
}
.dark .about-subtitle { 
  color: var(--color-slate-400);
  border-left-color: var(--color-slate-700);
}

/* Content Container */
.about-content {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  border: 1px solid var(--color-slate-200);
}
@media (max-width: 768px) {
  .about-content {
    padding: 1.5rem;
    gap: 3rem;
  }
}
.dark .about-content {
  background: var(--color-slate-900);
  border-color: var(--color-slate-800);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
}

/* Sections */
.about-section {
  display: flex;
  flex-direction: column;
}

.about-heading {
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-slate-900);
  border-bottom: 2px solid var(--color-slate-100);
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
@media (min-width: 768px) {
  .about-heading { font-size: 1.5rem; }
}
.dark .about-heading {
  color: white;
  border-bottom-color: var(--color-slate-800);
}

.about-body {
  font-size: 1.125rem;
  line-height: 1.75;
  color: var(--color-slate-700);
}
.dark .about-body { color: var(--color-slate-300); }
.about-body p { margin-bottom: 1.5rem; }
.about-body p:last-child { margin-bottom: 0; }

.text-link {
  color: var(--color-blue-accent);
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.2s;
}
.text-link:hover { color: #005090; }
.dark .text-link { color: #66a3e0; }
.dark .text-link:hover { color: #8cbdff; }

/* Code Blocks */
.code-wrapper {
  margin: 1.5rem 0;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  border: 1px solid var(--color-slate-200);
}
.dark .code-wrapper {
  border-color: var(--color-slate-700);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.5);
}

.code-block {
  margin: 0;
  padding: 1.5rem;
  background: var(--color-slate-50);
  color: var(--color-slate-800);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre;
}
.dark .code-block {
  background: #0f172a; /* Slate 950 */
  color: var(--color-slate-200);
}

/* Syntax Highlighting Fake Classes */
.code-key { color: #b91c1c; font-weight: 500; }
.code-string { color: #047857; }
.dark .code-key { color: #f87171; font-weight: 500; }
.dark .code-string { color: #34d399; }

/* Action Grid */
.action-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.action-chip {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: capitalize;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  background: var(--chip-bg);
  color: var(--chip-text);
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.dark .action-chip {
  border-color: rgba(255,255,255,0.1);
}

/* URN List */
.urn-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.urn-list li {
  background: var(--color-slate-50);
  padding: 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-slate-100);
}
.dark .urn-list li {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
}
.urn-list strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-slate-900);
}
.dark .urn-list strong { color: white; }
.urn-example {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-slate-500);
}

.inline-code {
  background: var(--color-slate-200);
  color: var(--color-slate-800);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.875em;
}
.dark .inline-code {
  background: var(--color-slate-800);
  color: var(--color-slate-200);
}

.urn-note {
  font-size: 0.9375rem;
  color: var(--color-slate-500);
  border-left: 2px solid var(--color-blue-accent);
  padding-left: 1rem;
  background: rgba(var(--color-blue-accent-rgb, 14, 116, 144), 0.05);
  padding: 1rem;
  border-radius: 0 0.5rem 0.5rem 0;
}
.dark .urn-note {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-slate-400);
}

/* Resolution Lifecycle */
.lifecycle-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.lifecycle-item {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.lifecycle-number {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--color-blue-accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
}
.dark .lifecycle-number {
  background: #2b5d8a;
}

.lifecycle-content {
  flex: 1;
  padding-top: 0.125rem;
}

.lifecycle-title {
  font-weight: 600;
  font-size: 1.125rem;
  color: var(--color-slate-900);
  margin-bottom: 0.375rem;
}
.dark .lifecycle-title { color: white; }

.lifecycle-desc {
  font-size: 1rem;
  color: var(--color-slate-600);
  line-height: 1.625;
  margin: 0 !important;
}
.dark .lifecycle-desc { color: var(--color-slate-400); }

/* Committee Section */
.committee-card {
  background: var(--color-slate-50);
  padding: 2rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-slate-100);
}
.dark .committee-card {
  background: rgba(30, 41, 59, 0.5);
  border-color: var(--color-slate-800);
}

.committee-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-slate-900);
  margin-bottom: 0.5rem;
}
.dark .committee-title { color: white; }

.committee-scope {
  font-size: 1rem;
  color: var(--color-slate-600);
  margin-bottom: 2rem !important;
  font-style: italic;
}
.dark .committee-scope { color: var(--color-slate-400); }

.committee-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}
@media (min-width: 640px) {
  .committee-stats { grid-template-columns: repeat(4, 1fr); }
}

.stat-item {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-blue-accent);
  line-height: 1.2;
}
.dark .stat-value { color: #66a3e0; }
.stat-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-slate-500);
  font-weight: 600;
}
.dark .stat-label { color: var(--color-slate-400); }

.committee-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  border-top: 1px solid var(--color-slate-200);
  padding-top: 1.5rem;
}
.dark .committee-links { border-top-color: var(--color-slate-700); }

.committee-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-slate-700);
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-slate-200);
  text-decoration: none;
  transition: all 0.2s;
}
.dark .committee-link {
  background: var(--color-slate-800);
  color: var(--color-slate-200);
  border-color: var(--color-slate-700);
}
.committee-link:hover {
  border-color: var(--color-blue-accent);
  color: var(--color-blue-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.dark .committee-link:hover {
  border-color: #66a3e0;
  color: #66a3e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}
</style>
