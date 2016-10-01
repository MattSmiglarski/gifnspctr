var webpack = require('webpack');

process.env.BABEL_ENV = process.env.npm_lifecycle_event;

const PATHS = {
    build: '/Users/matthew/dev/gifnspctr/build'
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
    devtool: 'eval',
    output: {path: __dirname + '/public', filename: 'build/bundle.js'},
    /*output: {
        path: PATHS.build,
        filename: 'index_bundle.js'
    },*/
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        htmlWebpackPlugin
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