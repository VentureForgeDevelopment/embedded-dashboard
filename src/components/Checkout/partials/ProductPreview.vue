<template>
  <div class="product-preview">
    <p class="product-preview-title">
      {{ title }}
    </p>
    <p class="product-preview-body">
      {{ body }}
    </p>
  </div>
</template>

<script>
export default {
  name: "ProductPreview",
  props: {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return {}
  },
}
</script>
<style scoped>
.product-preview {
  text-align: left;
}
.product-preview-title {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2em;
  margin-bottom: 15px!important;
}
.product-preview-body {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.3rem;
}

@media screen and (max-width: 550px) {
  .product-preview-title {
    font-size: 24px !important;
  }
  .product-preview-body {
    font-size: 14px !important;
  }
}
</style>
