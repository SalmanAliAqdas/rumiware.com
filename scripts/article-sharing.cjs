// Build-time values only: never derive a share URL from a visitor's location.
module.exports=function articleSharing(canonical,title){
 const url=new URL(canonical);
 if(url.origin!=='https://rumiware.com'||url.search||url.hash||url.username||url.password||!/^\/blog\/[a-z0-9-]+\/$/.test(url.pathname))throw Error('Invalid article sharing canonical');
 if(typeof title!=='string'||!title.trim())throw Error('Missing article sharing title');
 return {
  SHARE_CANONICAL:canonical,
  SHARE_FACEBOOK:'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(canonical),
  SHARE_LINKEDIN:'https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(canonical),
  SHARE_WHATSAPP:'https://wa.me/?text='+encodeURIComponent(title+'\n'+canonical)
 };
};
