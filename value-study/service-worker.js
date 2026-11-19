/* Offline app shell; build v14 for value-study. */
const CACHE_NAME = 'art-tools-value-study-v14';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
 event.waitUntil((async () => {
  const cache=await caches.open(CACHE_NAME);
  await cache.addAll(APP_SHELL);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const all=await caches.keys();
  await Promise.all(all.filter(k=>k.startsWith('art-tools-value-study-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin || !url.href.startsWith(self.registration.scope))return;
 if(req.mode==='navigate'){
  // Fetch an updated page when online, but retain a complete app when offline.
  event.respondWith((async()=>{
   try{
    const response=await fetch(req);
    if(response.ok){
     const cache=await caches.open(CACHE_NAME);
     await cache.put(new URL('./index.html',self.registration.scope).href,response.clone());
    }
    return response;
   }catch(err){
    const cache=await caches.open(CACHE_NAME);
    const saved=await cache.match(new URL('./index.html',self.registration.scope).href);
    if(saved)return saved;
    return Response.error();
   }
  })());
  return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(req,{ignoreSearch:true});
  if(cached)return cached;
  const response=await fetch(req);
  if(response.ok)await cache.put(req,response.clone());
  return response;
 })());
});
