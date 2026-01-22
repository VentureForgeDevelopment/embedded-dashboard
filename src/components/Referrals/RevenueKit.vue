<template>
  <div class="revenue-kit-container">
    <h3 class="section-subtitle">Revenue Kit</h3>
    <p class="section-description">
      Website Translation Revenue Kit (for digital agencies)
      <strong
        >Everything you need to start selling multilingual websites as a
        high-margin, recurring service — with zero dev time.</strong
      >
      Use the tools below to pitch clients, calculate pricing, close deals, and
      launch fast. From cold emails to a live demo in under an hour — this kit
      makes translation a revenue stream you can deploy today.
    </p>

    <div class="resource-container">
      <ul class="resource-list">
        <li v-for="resource in resources" :key="resource.id">
          <a v-if="resource.type === 'pdf'" href="#" @click.prevent="downloadFile(resource.file)">
            <DownloadOutline class="icon" />
            {{ resource.name }}
          </a>
          <a v-else-if="resource.type === 'link'" :href="resource.url" target="_blank">
            <OpenInNew class="icon" />
            {{ resource.name }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import DownloadOutline from "vue-material-design-icons/DownloadOutline.vue"
import OpenInNew from "vue-material-design-icons/OpenInNew.vue"

const resources = ref([
  {id: 1, type: "link", name:"Quick Start Guide", url: "https://weblinguist.ai/wp-content/uploads/2025/12/Web-Linguist-Quick-Start-Guide-v1.pdf"},
  {id: 2, type: "pdf", name: "Partner Agency Email Pitch templates", file: "partner_agency_email_pitch_templates.pdf" },
  {id: 3, type: "pdf", name: "Partner Agency Funnel Strategy", file: "partner_agency_funnel_strategy.pdf" },
  {id: 4, type: "pdf", name: "Partner Agency Objection Handling Guide", file: "partner_agency_objection_handling_guide.pdf" },
  {id: 5, type: "pdf", name: "Suggested Agency Pricing Packages", file: "suggested_agency_pricing_packages.pdf" },
  {id: 6, type: "pdf", name: "Web Linguist Partner Agency Translation Proposal", file: "web_linguist_partner_agency_translation_proposal.pdf" },
  {id: 7, type: "link", name:"Website Translation Proposal Slide Deck", url: "https://docs.google.com/presentation/d/1NbtD1aLZCq6GQse6ojg9ip22i3ulVmetmN8uLOZ-L9k/edit?usp=sharing"},
  {id: 8, type: "pdf", name:"Slide Deck Script", file: "slide_deck_script.pdf"},
  {id: 9, type: "pdf", name:"Bonus Day 1 Offer Email", file: "bonus_day1_offer_email.pdf"},
  {id: 10, type: "link", name: "Agency Webinar Replay", url: "https://weblinguist.ai/replay-agency-webinar/"}
])

const downloadFile = (fileName) => {
  const link = document.createElement("a")
  link.href = `/pdfs/${fileName}`
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.revenue-kit-container {
  padding: 1rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  text-align: left;
  background: #fff;
}
.section-subtitle {
  margin-top: 0;
}
.section-description {
  color: var(--text-secondary);
}
.resource-list {
  list-style: none;
  padding: 0;
  margin-top: 20px;
}
.resource-list li {
  margin-bottom: 12px;
}
.resource-list a {
  text-decoration: none;
  color: var(--accent-color);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s ease-in-out;
}
.resource-list a:hover {
  color: var(--highlight-color);
  text-decoration: underline;
}
.icon {
  font-size: 20px;
}
</style>
