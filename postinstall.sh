# link our local js app
cd public/src/app;
npm link;
cd ../../../;
npm link app;
# link nested handlebars instance
cd node_modules/koa-hbs/node_modules/handlebars
npm link;
cd ../../../../
npm link handlebars
