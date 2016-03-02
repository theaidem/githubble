var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var port = 3001;

module.exports = {
	devtool: '#inline-source-map',
	entry: [
		'eventsource-polyfill', // necessary for hot reloading with IE
		'webpack-dev-server/client?http://0.0.0.0:' + port,
		'webpack/hot/only-dev-server',
		'./src/scripts/index'
	],
	output: {
		filename: 'js/app.js',
		path: path.join(__dirname, 'dist')
	},
	plugins: [
		new ExtractTextPlugin('css/style.css'),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoErrorsPlugin(),
		new HtmlWebpackPlugin({
			title: 'GitHubble',
			filename: 'index.html',
			template: 'src/index.tpl',
			favicon: path.join(__dirname, 'src', 'images', 'favicon.ico')
		})
	],
	module: {
		loaders: [
			{ test: /\.js$/, loaders: ['babel'], include: path.join(__dirname, 'src/scripts') },
			{ test: /\.css$/, loader: ExtractTextPlugin.extract('style', 'css', {publicPath: "../"}) },
			{ test: /\.(png|jpg)$/, loader: 'file?name=images/[name].[hash].[ext]' },
			{ test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?name=fonts/[name].[hash].[ext]&mimetype=application/font-woff'},
			{ test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,loader: 'file?name=fonts/[name].[hash].[ext]&mimetype=application/font-woff'}, 
			{ test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?name=fonts/[name].[hash].[ext]&mimetype=application/octet-stream'}, 
			{ test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?name=fonts/[name].[hash].[ext]'}, 
			{ test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'file?name=images/[name].[hash].[ext]&mimetype=image/svg+xml' }
		]
	},
	devServer: {
		historyApiFallback: true,
		stats: { colors: true },
		hot: true,
		port: port
	}
};
