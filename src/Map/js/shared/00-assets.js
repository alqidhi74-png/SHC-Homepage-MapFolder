/* Sultan Haitham City — official brand & content asset references.
   Everything under assets/city/ is supplied by the client and is used
   exactly as provided (original files, original resolution). */
const ASSET={
  mark:'assets/logo-mark.png', markAR:0.6715,
  lockup:'assets/logo-lockup.png', lockupAR:1.2456,
  plan:'assets/master-plan.jpg',
  /* homepage hero — official aerial render, 2048×2048 original
     (a 1280 px copy is offered to small screens only via srcset) */
  hero:'assets/city/hero-aerial.jpg', hero1280:'assets/city/hero-aerial-1280.jpg', heroW:2048, heroH:2048,
  /* section 02 "افهم" — official city-facts image, 825×712 original */
  facts:'assets/city/city-facts.png', factsW:825, factsH:712,
  /* source of the section 01 "اكتشف" phrases (kept for reference) */
  legacy:'assets/city/future-legacy.jpg'
};
/* Real-photograph slots (sections 04 · 05 · 07 and the Real Estate pages).
   Drop a photograph at  assets/photos/<slot>.jpg  and it appears
   automatically — see assets/photos/README.md for the full slot list.
   Until a slot has its photo, the previous artwork stays as a temporary
   fill and, while `labels` is true, a small tag names the missing file. */
const PHOTO={base:'assets/photos/',ext:'.jpg',labels:true};
