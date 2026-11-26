/* ---------- start ---------- */
main.snap();main.sync(false);route();updQueue();
if(document.fonts)document.fonts.ready.then(()=>changed());
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>changed());
