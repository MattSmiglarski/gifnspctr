const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// make babel aware of HMR so it doesn't destroy app state on hot reload
//process.env.BABEL_ENV = process.env.npm_lifecycle_event;

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
    output: {
        path: __dirname + '/public',
        filename: 'build/bundle.js'},
    plugins: [
        htmlWebpackPlugin,
        copyWebpackPlugin,
        new ExtractTextPlugin("style.css"),
        new webpack.optimize.UglifyJsPlugin(),
    ],
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: ["css-loader", "sass-loader"]
                })
            },
            {
                test: /\.jsx?$/,
                loaders: ['babel-loader'], // Consider adding back react-hot-loader
            }
        ]
    }
};