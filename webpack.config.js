process.env.BABEL_ENV = process.env.npm_lifecycle_event;

const PATHS = {
    build: './build'
};

var Webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var htmlWebpackPlugin = new HtmlWebpackPlugin({
    title: 'GIF inspector demo',
    minify: false,
    template: './app/index.html'
});

module.exports = {
    entry: './app/scripts/index.js',
    devtool: 'source-map',
    output: {
        path: PATHS.build,
        filename: 'index_bundle.js'
    },
    plugins: [
        htmlWebpackPlugin
    ],
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel'],
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