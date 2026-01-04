const webpack = require("@nativescript/webpack");
const { resolve } = require("path");

module.exports = (env) => {
	webpack.init(env);

	// Learn how to customize:
	// https://docs.nativescript.org/webpack

	webpack.chainWebpack((config) => {
		const appNodeModules = resolve(__dirname, 'node_modules');
		
		// Configure alias to resolve @a2ui packages from source
		config.resolve.alias.set('@a2ui/nativescript', resolve(__dirname, '../../../renderers/nativescript/src/public-api.ts'));
		
		// Point to our shim that only exports types (no runtime code from lit)
		config.resolve.alias.set('@a2ui/lit/0.8', resolve(__dirname, 'src/a2ui-lit-shim.ts'));
		config.resolve.alias.set('@a2ui/lit', resolve(__dirname, 'src/a2ui-lit-shim.ts'));
		
		// Ensure all modules resolve from the app's node_modules
		config.resolve.modules.prepend(appNodeModules);
		
		// Add extension alias for .js -> .ts resolution
		config.resolve.extensionAlias = {
			'.js': ['.ts', '.js'],
		};
	});

	return webpack.resolveConfig();
};
