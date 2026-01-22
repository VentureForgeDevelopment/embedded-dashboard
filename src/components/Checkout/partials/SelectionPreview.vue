<template>
  <div class="selection-preview">
    <div class="selection-preview-card">
      <div class="selection-preview-card-top">
        <p>
          {{ current_product?.name }}
        </p>
      </div>
      <ul class="selection-preview-card-features">
        <li
          v-for="currentProductFeature in currentProductFeatures"
          :key="currentProductFeature.id"
        >
          {{ currentProductFeature }}
        </li>
      </ul>
    </div>

    <div class="arrow-icon-container">
      <i class="fas fa-arrow-right" aria-hidden="true"></i>
    </div>

    <div class="selection-preview-card">
      <div class="selection-preview-card-top">
        <p>
          {{ selected_product?.name }}
        </p>
      </div>

      <ul class="selection-preview-card-features">
        <li
          v-for="selectedProductFeature in selectedProductFeatures"
          :key="selectedProductFeature.id"
        >
          {{ selectedProductFeature }}
        </li>
      </ul>
    </div>

    <div class="breakdown-details-wrapper">
      <div class="breakdown-details">
        <ul>
          <li
            v-for="selectedProductFeature in selectedProductFeatures"
            :key="selectedProductFeature.id"
          >
            <span
              :class="{
                'double-chevron-up': upgrading,
                'double-chevron-down': !upgrading,
              }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                id="mdi-chevron-double-up"
                viewBox="0 0 24 24"
              >
                <path
                  d="M7.41,18.41L6,17L12,11L18,17L16.59,18.41L12,13.83L7.41,18.41M7.41,12.41L6,11L12,5L18,11L16.59,12.41L12,7.83L7.41,12.41Z"
                />
              </svg>
            </span>
            {{ selectedProductFeature }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useCheckoutStore } from '../../../stores/checkout'

export default {
  name: "SelectionPreview",
  props: {
    current_product: {
      type: Object,
      default: null,
    },
    selected_product: {
      type: Object,
      default: null,
    },
    upgrading: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const checkoutStore = useCheckoutStore();

    const features = computed(() => checkoutStore.state.checkout_products_features);

    const getFeaturesForProduct = (product) => {
      if ( !product ) return [];

      // Try multiple possible property names that might contain the plan name
      const productName = product.name || product.type || product.title;

      if (!productName || !features.value) return [];

      // Direct match first
      if (features.value[productName] && features.value[productName].length > 0) {
        return features.value[productName];
      }

      // Fallback: search for partial matches
      const featureKey = Object.keys(features.value).find((key) => {
        return (
          key.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(key.toLowerCase())
        );
      });

      return featureKey ? features.value[featureKey] : [];
    };

    const currentProductFeatures = computed(() =>
      getFeaturesForProduct(props.current_product)
    );
    const selectedProductFeatures = computed(() =>
      getFeaturesForProduct(props.selected_product)
    );

    return {
      currentProductFeatures,
      selectedProductFeatures,
    };
  },
};
</script>
<style scoped>
.selection-preview {
  display: flex;
  align-items: center;
}
.selection-preview .selection-preview-card {
  align-items: center;
  border: 1px solid #929292;
  border-radius: 10px;
}
.selection-preview-card-top {
  border-bottom: 1px solid black;
  font-weight: 400;
}
.selection-preview-card-top p {
  padding: 15px;
  margin-bottom: 0;
  font-size: 15px;
  max-width: 200px;
}
.selection-preview-card-features {
  padding: 20px 25px;
  max-height: 125px;
  overflow-y: auto;
}
.selection-preview-card-features li {
  font-size: 12px;
  margin-bottom: 3px;
}
.arrow-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin: 0 10px !important;
}
.breakdown-details {
  margin: 20px;
  display: flex;
  overflow-y: auto;
  max-height: 250px;
}
.breakdown-details ul {
  list-style: none;
  padding: 20px;
  padding-right: 0;
}
.breakdown-details ul li {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  font-size: 16px;
}
.double-chevron-up,
.double-chevron-down {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.double-chevron-up svg,
.double-chevron-down svg {
  width: 35px;
  height: 35px;
}
.double-chevron-up svg {
  fill: #27ae60;
}
.double-chevron-down svg {
  fill: #e74c3c;
  transform: rotate(180deg);
}
</style>
