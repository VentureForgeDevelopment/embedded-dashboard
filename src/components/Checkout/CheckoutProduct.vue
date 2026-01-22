<template>
  <!-- show by product (toggle switches price selection) -->
  <div
    class="checkout-product"
    @click="productSelected(product)"
    tabindex="0"
    v-if="!show_individual_prices"
  >
    <p class="product-title">
      {{ product.name === "Starter" ? "Standard" : product.name }}
    </p>

    <div v-if="product.id !== 'free-tier'" class="price-box">
      <span>
        <span class="product-price">
          ${{ parseFloat(price.unit_amount).toFixed(2) }}
        </span> /
        {{ selected_billing_term ? "year" : "month" }}
      </span>
    </div>
    <div v-else class="price-box">
      <span> Free Forever! </span>
    </div>

    <hr class="divider">

    <div class="features-list">
      <ul>
        <li v-for="feature in visibleFeatures" :key="feature">
          <Check
            fill-color="var(--success-green)"
            style="
              display: inline-flex;
              justify-content: center;
              align-items: center;
              margin-right: 0.5rem;
            "
          />
          {{ feature }}
        </li>
      </ul>
      <div v-if="hiddenFeaturesCount > 0" class="show-more-wrapper">
        <button
          @click.stop="toggleShowAllFeatures"
          class="show-more-button btn btn-link"
        >
          {{
            showAllFeatures
              ? "Show less features"
              : `Show ${hiddenFeaturesCount} more features`
          }}
        </button>
      </div>
    </div>
  </div>
  <!-- show by price (directly select price) -->
  <div v-else class="prices-wrapper">
    <div
      v-for="price in individualizedPrices"
      :key="price.id"
      :class="[
        'checkout-product display-inline',
        {
          is_selected:
            selected_product &&
            selected_price &&
            selected_price.id === price.id,
        },
      ]"
      @click="priceSelected(price)"
      tabindex="0"
    >
      <p v-if="price.id !== 'free-tier-price'" class="product-title">
        {{
          price.recurring.interval === "month" ? "Monthly Plan" : "Yearly Plan"
        }}
      </p>
      <p v-else class="product-title">Free Plan</p>

      <div
        v-if="price.id !== 'free-tier-price'"
        class="price-box display-stacked"
      >
        <span class="intial-discount-price">
          <span class="text">
            <span class="bold">
              ${{ price.recurring.interval === "month" ? 1 : 109 }}
            </span>
            for your first {{ price.recurring.interval }}!
          </span>
        </span>
        <span class="actual-price-description">
          Then ${{ parseFloat(price.unit_amount).toFixed(2) }} /
          {{ price.recurring.interval }}
        </span>
      </div>
      <div v-else class="price-box display-stacked">
        <span class="intial-discount-price">
          <span>
            <span class="bold"> Free Forever! </span>
          </span>
        </span>
        <span class="actual-price-description"> Upgrade Anytime </span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from "vue"
import { useCheckoutStore } from "../../stores/checkout"
import Check from "vue-material-design-icons/Check.vue"

export default {
  name: "CheckoutProduct",
  props: {
    product: {
      type: Object,
      required: true,
    },
    selected_product: {
      type: Object,
      default: null,
    },
    selected_price: {
      type: Object,
      default: null,
    },
    selected_billing_term: {
      type: Boolean,
      required: true,
    },
    show_individual_prices: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    Check,
  },
  setup(props, { emit }) {
    const checkoutStore = useCheckoutStore()
    const showAllFeatures = ref(false)

    //computed
    const price = computed(() => {
      let billing_term = props.selected_billing_term ? "year" : "month"

      // Find the price with the matching interval
      const matchingPrice = props.product.prices.find(
        (price) => price.recurring && price.recurring.interval === billing_term
      )

      // Return the price ID if found, otherwise null
      return matchingPrice ? matchingPrice : null
    })

    const features = computed(() => {
      return checkoutStore.state.checkout_products_features
    })

    const productFeatures = computed(() => {
      if (!props.product) return []

      // Try multiple possible property names that might contain the plan name
      const productName =
        props.product.name || props.product.type || props.product.title

      if (!productName || productName === undefined) return []

      if (
        !features.value[productName] ||
        features.value[productName] === undefined
      )
        return []

      // Direct match first
      if (
        features.value[productName] &&
        features.value[productName].length > 0
      ) {
        return features.value[productName]
      }

      // Fallback: search for partial matches
      const featureKey = Object.keys(features.value).find((key) => {
        return (
          key.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(key.toLowerCase())
        )
      })

      return featureKey ? features.value[featureKey] : []
    })

    const individualizedPrices = computed(() => {
      if (props.product && props.product.prices) {
        // If it's the free tier, only return one price option to avoid duplication
        if (props.product.is_free_tier) {
          return [props.product.prices[0]]
        }
        return props.product.prices
      }
      return []
    })

    const visibleFeatures = computed(() => {
      if (showAllFeatures.value) {
        return productFeatures.value
      }
      return productFeatures.value.slice(0, 4)
    })

    const hiddenFeaturesCount = computed(() => {
      const count = productFeatures.value.length - 4
      return count > 0 ? count : 0
    })

    function toggleShowAllFeatures() {
      showAllFeatures.value = !showAllFeatures.value
    }

    //methods
    function productSelected(product) {
      if (props.selected_product && props.selected_product.id === product.id) {
        emit("productSelected", null, null)
        return
      }
      emit("productSelected", product, price.value)
    }

    function priceSelected(price) {
      if (props.selected_price && props.selected_price.id === price.id) {
        emit("productSelected", null, null)
        return
      }
      emit("productSelected", props.product, price)
    }

    return {
      price,
      productFeatures,
      individualizedPrices,
      visibleFeatures,
      hiddenFeaturesCount,
      showAllFeatures,
      //methods
      productSelected,
      priceSelected,
      toggleShowAllFeatures,
      //components
      Check,
    }
  },
}
</script>
<style>
.checkout-product {
  border: 1px solid #ddd;
  border-radius: 25px;
  padding: 20px 40px;
  margin: 0 auto;
  position: relative;
  background: white;
  cursor: pointer;
  transform: translate(0px, 0px);
  margin-bottom: 15px;
  max-width: 300px;
  transition: all 0.2s ease-in-out;
}
.checkout-product.display-inline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 700px;
  width: 100%;
  padding:40px;
}
.checkout-product:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--success-green) !important;
}
.checkout-product.is_selected {
  border: 1px solid var(--success-green) !important;
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.current-step-container p {
  margin-left: 25px;
  font-weight: bold;
}
.prices-wrapper {
  display: flex;
  flex-direction: column-reverse;
}
.selected-product {
  position: absolute;
  top: 15px;
  left: 15px;
  border: 1px solid #ddd;
  width: 30px;
  min-width: 30px;
  max-width: 30px;
  height: 30px;
  min-height: 30px;
  max-height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}
hr.divider{
  border-color: lightgray;
}
.price-box {
  margin-top: 15px;
  text-align: left;
  margin-left: 2rem;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
}
.price-box.display-stacked {
  display: flex;
  flex-direction: column;
}
.price-box .initial-discount-price .text{
  color:var(--text-primary)!important;
}
.price-box .actual-price-description {
  font-size: 14px;
  color: #696969;
  align-self: flex-start;
  margin-top: 5px;
}
.product-price{
  font-size:1.5em;
  color:var(--text-primary);
}
.selected-product.display-inline {
  position: static;
}
.checkout-product.checkout-product.is_selected .selected-product {
  border: 1px solid var(--success-green) !important;
}
.selected-product svg {
  font-size: 30px;
  color: var(--success-green);
}
.product-title {
  margin: 15px 0;
  margin-left: 2rem;
  font-size: 1.5em;
  text-align: left;
  font-weight: 600;
}
.checkout-product.display-inline .product-title {
  margin: 15px 60px 15px 15px;
}
.features-list {
  min-height: 50px;
}
.features-list ul {
  list-style: none;
  padding: 0;
  text-align: left;
  margin-bottom: 20px;
  color:var(--text-secondary);
}
.features-list li {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}
.show-more-wrapper {
  text-align: left;
}
.show-more-button {
  font-weight: bold;
}
.show-more-button:hover,
.show-more-button:focus,
.show-more-button:focus-within {
  text-decoration: underline;
}
.bold {
  font-size: 1.25em;
  font-weight: bold;
  color:var(--text-primary);
}
@media screen and (max-width: 769px) {
  .checkout-product.display-inline {
    flex-direction: column;
  }
}
</style>
