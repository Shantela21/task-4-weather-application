/**********************
 * CRACO config to enable TailwindCSS (PostCSS) with CRA
 **********************/
module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
};
