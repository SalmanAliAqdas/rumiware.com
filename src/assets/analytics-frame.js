/* Receives only fixed public page metadata from the consent controller. */
(function () {
  var origins = PRODUCTION_ORIGINS, id = MEASUREMENT_ID, initialized = false;
  window['ga-disable-' + id] = true;
  addEventListener('message', function (event) {
    if (window === parent || initialized || event.source !== parent || origins.indexOf(event.origin) === -1 ||
        event.origin !== location.origin || !event.data || event.data.type !== 'rw-page-analytics' || event.data.measurementId !== id) return;
    initialized = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = [];
    function gtag() { dataLayer.push(arguments); }
    gtag('consent', 'default', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'});
    gtag('set', event.data.config);
    gtag('js', new Date());
    gtag('config', id, event.data.config);
    gtag('event', 'page_view', {send_to:id});
    var tag = document.createElement('script');
    tag.async = true; tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(tag);
  });
})();
