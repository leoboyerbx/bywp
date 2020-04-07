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
        app: [<% if (project.options.includes("sass")) { %>'./assets/scss/app.scss'<% } else { %>'./assets/css/app.css'<% } %>, <% if (project.options.includes("typescript")) { %>'./assets/ts/app.ts'<% } else { %>'./assets/js/app.js'<% } %>]
    },
    resolve: {
        alias: {
            '@': path.resolve('./assets/js/'),
            '@css': path.resolve('./assets/css/'),
            '@scss': path.resolve('./assets/scss/'),
            '@img': path.resolve('./assets/img/')
        }<% if(project.options.includes('typescript')) { %>,
        extensions: ['.tsx', '.ts', '.js'] <% } %>
    },
    watch: dev,
    mode: dev ? 'development' : 'production',
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
            },<% }
                if (project.options.includes("typescript")) {
            %>
            {
                test: /\.tsx?$/,
                    use: ['ts-loader'],
                exclude: /node_modules/
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
