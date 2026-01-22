<template>
  <div class="ads-container">
    <h3 class="section-subtitle">Ads</h3>
    <p class="section-description">
      Below are some ads you can use to promote Web Linguist.
    </p>
    <div class="creatives-grid">
      <div class="creative-item">
        <div class="image-container">
          <img
            :src="ad300x250"
            alt="WebLinguist Affiliate Ad 300x250"
            @click="downloadImage(ad300x250)"
          />
          <button
            @click="downloadImage(ad300x250)"
            class="download-button"
          >
            <Download />
          </button>
        </div>
        <div class="dimensions">300x250</div>
      </div>
      <div class="creative-item">
        <div class="image-container">
          <img
            :src="ad336x280"
            alt="WebLinguist Affiliate Ad 336x280"
            @click="downloadImage(ad336x280)"
          />
          <button
            @click="downloadImage(ad336x280)"
            class="download-button"
          >
            <Download />
          </button>
        </div>
        <div class="dimensions">336x280</div>
      </div>
    </div>
  </div>
</template>

<script>
import Download from "vue-material-design-icons/Download.vue"


export default {
  name: "Ads",
  components: {
    Download,
  },
  setup() {
    const ad300x250 = new URL(
      "../../assets/images/WebLinguist_Affiliate_300x250.jpg",
      import.meta.url
    ).href

    const ad336x280 = new URL(
      "../../assets/images/WebLinguist_Affiliate_336x280.jpg",
      import.meta.url
    ).href

    const downloadImage = (url) => {
      const link = document.createElement("a")
      link.href = url
      link.download = url.substring(url.lastIndexOf("/") + 1)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    return {
      downloadImage,
      ad300x250,
      ad336x280,
      //components
      Download,
    }
  },
}
</script>

<style scoped>
.ads-container {
  padding: 1rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  text-align: left;
}
.section-subtitle {
  font-size: 18px;
  margin-bottom: 0.5rem;
}
.section-description {
  font-size: 14px;
  margin-bottom: 1.5rem;
  text-align: left;
}
.creatives-grid {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
.creative-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor:pointer;
}
.image-container {
  position: relative;
  line-height: 0;
}
.creative-item img {
  max-width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}
.dimensions {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}
.download-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
