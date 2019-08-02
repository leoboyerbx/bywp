const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const dev = process.env.NODE_ENV === "dev"

let styleLoaders = [
    {
        loader: MiniCssExtractPlugin.loader,
        options: {
            hmr: process.env.NODE_ENV === 'development',
        },
    },
    'css-loader'
]

let config = {
    entry: {
        app: [<% if (project.options.includes("sass")) { %>'./assets/scss/app.scss'<% } else { %>'./assets/css/app.css'<% } %>, './assets/js/app.js']
    },
    resolve: {
        alias: {
            '@': path.resolve('./assets/js/'),
            '@css': path.resolve('./assets/css/'),
            '@scss': path.resolve('./assets/scss/'),
            '@img': path.resolve('./assets/img/')
        }
    },
    watch: dev,
    mode: 'development',
    plugins: [
        new MiniCssExtractPlugin({
            filename: "style.bundle.css"
        })
    ],
    devtool: dev ? "cheap-module-eval-source-map" : "source-map",
    module: {
        rules: [
            <% if (project.options.includes("eslint-standard")) { %>{
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: ['eslint-loader']
            },<% } %>
            {
                test: /\.css$/,
                use: styleLoaders
            },
        <% if (project.options.includes("sass")) { %>{
        test: /\.scss$/,
            use: [...styleLoaders, 'sass-loader']
    },<% } %>
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.* )?$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[name].[hash:7].[ext]'
                }
            },
            {
                test: /\.(wav|mpe?g?[234]|webm|ogg|ogv)(\?.* )?$/,
                loader: 'file-loader',
                options: {
                    name: 'media/[name].[hash:7].[ext]'
                }
            },
            {
                test: /\.(png|gif|jpg|svg)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            name: 'images/[name].[hash:7].[ext]'
                        },
                    },
                    {
                        loader: 'img-loader',
                        options: {
                            enabled: !dev
                        }
                    }
                ],
            },
        ]
    },
    output: {
        path: path.resolve(__dirname, 'public/assets'),
        filename: '[name].bundle.js'
    }

};

module.exports = config