var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

// make babel aware of HMR so it doesn't destroy app state on hot reload
process.env.BABEL_ENV = process.env.npm_lifecycle_event;

var htmlWebpackPlugin = new HtmlWebpackPlugin({
    title: 'GIF inspector demo',
    minify: false,
    template: './app/index.html'
});

// Copy over sample images.
var copyWebpackPlugin = new CopyWebpackPlugin([
    { from: 'app/images' }
]);

module.exports = {
    entry: './app/scripts/index.js',
    devtool: 'eval',
    output: {path: __dirname + '/public', filename: 'build/bundle.js'},
    plugins: [
        htmlWebpackPlugin,
        copyWebpackPlugin
    ],
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['react-hot', 'babel'],
            exclude: /node_modules/
        }, {
            test: /\.css$/,
            loaders: ['style', 'css']
        }, {
            test: /\.scss$/,
            loaders: ['style', 'css', 'sass']
        }]
    }
};