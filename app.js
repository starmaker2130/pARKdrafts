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

app.instance.get('/receipt', function(req, res){
    res.render('receipt.html', {root: app.config.DIRECTORY[0]});
});

app.instance.get('/track', function(req, res){
    res.render('trackdelivery.html', {root: app.config.DIRECTORY[0]});
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

var subjects = {};
var history = [];

io.on('connection', function(socket){
    console.log(`socket ${socket.id} connected`);
    
    socket.on('retrieveAssociatedOrder', function(data){
        let timein = data.time;
        console.log(`--------------------- \nretrieve order request at ${timein}`);
        
        for(var i=0; i<history.length; i++){
            isThisYourOrder(i, timein);
        }
    });
    
    function isThisYourOrder(item, timein){
        let curr = history[item].time;
        let diff = Math.abs(curr-timein);
        console.log(diff);
        if(diff<1000){
            console.log('found your order');
            socket.emit('loadAssociatedOrder', {order: history[item].order});
        }
    }
    
    socket.on('validateConnection', function(data){
        //let curr = Object.keys(subjects).length;
        let currID = socket.id;
        console.log(`user connected to dlt: ${data.status} at ${data.time}`);
        
        subjects[currID] = {
            id: currID,
            status: data.status,
            time: data.time,
            page: 0
        };
        console.log(`------------------------`);
        console.log(subjects[currID]);
        
        socket.emit('connectionValidated', {status: true, time: new Date()});
    });
    
    socket.on('moveToPage', function(data){
        subjects[socket.id].page = data.page;
        console.log(`${subjects[socket.id].id} now on page ${subjects[socket.id].page}`);
        socket.emit('pageChangeAcknowledged', {status: true, time: new Date()});
    });
    
    socket.on('submitOrder', function(data){
        subjects[socket.id].order = data;
        let user = subjects[socket.id];

        console.log(`----------------- \n order complete for ${user.id} at \n latitude ${user.order.location.lat} \n longitude ${user.order.location.long} \n with accuracy ${user.order.location.accuracy} \n -------------- \n items: ${user.order.cart} \n payment method: ${user.order.paidWith} \n -----------------`);
        
        let timeout = (new Date()).getTime();
        history.push({time: timeout, order: user.order});
        socket.emit('orderReceived', {status: true, time: timeout});
    });
            
    socket.on('disconnect', function(data){
        let prev = Object.keys(subjects).length;
        delete subjects[socket.id];
        let curr = Object.keys(subjects).length;
        
        console.log(`prev: ${prev} | curr: ${curr} | ${socket.id} disconnected`);
    });
});