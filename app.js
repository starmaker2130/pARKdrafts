/*
*   author: Patrice-Morgan Ongoly (@starmaker2130)
*   last modified: sunday, april 14, 2019 0844 utc-5
*   version: 0.0.2
*   title: public Augmented Reality kinectome - delivery service
*
*/

"use strict";

var bodyParser = require('body-parser');
var express = require('express');
var WhichBrowser = require('which-browser');

var app = {
    instance: express(),
    config: {
        PORT: process.env.PORT || 3000,
        DIRECTORY: [
            './',       //0
            './css',    //1
            './js',     //2
            './media/icon',     //3
            './media/img',      //4
        ]
    },
    cart : {
        items: [],
        subtotal: 0
    }
};

app.instance.engine('html', require('ejs').renderFile);

app.instance.use(bodyParser.json({limit: '50mb'}));
app.instance.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.instance.get('/', function(req, res){
    const deviceConnected = new WhichBrowser(req.headers);
    if(deviceConnected.isType('desktop')){
        console.log(`Connected to a desktop computer. \n ${deviceConnected.toString()}.`);
    }
    else{
        console.log(`Connected to a mobile computer. \n ${deviceConnected.toString()}.`);
    }
    res.render('index.html', {root: app.config.DIRECTORY[0]});
});

app.instance.get('/css/:stylesheet_id', function(req, res){
    let stylesheetId = req.params.stylesheet_id;
    res.sendFile(stylesheetId, {root: app.config.DIRECTORY[1]});
});

app.instance.get('/js/:script_id', function(req, res){
    let scriptId = req.params.script_id;
    res.sendFile(scriptId, {root: app.config.DIRECTORY[2]});
});

app.instance.get('/media/icon/:icon_id', function(req, res){
    let iconId = req.params.icon_id;
    res.sendFile(iconId, {root: app.config.DIRECTORY[3]});
});

app.instance.get('/media/img/:img_id', function(req, res){
    let imgId = req.params.img_id;
    res.sendFile(imgId, {root: app.config.DIRECTORY[4]});
});

/*app.instance.listen(app.config.PORT, function(){
    console.log(`[0] listening on port ${app.config.PORT}`);
});
*/

var io = require('socket.io').listen(app.instance.listen(app.config.PORT, function(){
    console.log(`[0] listening on port ${app.config.PORT}`);
}));

var subjects = [];

io.on('connection', function(socket){
    console.log(`socket ${socket.id} connected`);
    
    socket.on('disconnect', function(data){
        console.log(`${socket.id} disconnected`);
    });
});