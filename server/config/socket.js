var io = require('socket.io')();
const colors = require('colors');
const ResponseModel = require('../models/response.js');

var savedInputs = ["this will be the first entry", "this wil be the second entry",
"this will be the third entry", "Justin got this feature working",
"Justin made this function work. Thank him sometime."];
var savedInputsWithArgs = ["Welcome To Class"]
var savedInputsNoArgs = ["Welcome To Class Everyone!"]
io.on('connection', function(socket) {

  io.emit('chat message', "Use the number's to enter prerecorded text")
  io.emit('chat message', "Use +help or -help to see commands");


  console.log(socket.conn.id);
  socket.on('chat message', function(data) {
    console.log("MESSAGE:" + data + " FROM:" ["red"] + socket.conn.id);
    io.to('customAlexaResponsePage').emit('chat message', data) //relay chat message back to all in chat room
    let readCount = 0
    if (data === "stop") {
      readCount = 1 //the server will not read the message if the readcount is greater than 0
    }
    const response = new ResponseModel({type: "maya_class", text: data, readCount: readCount});
    response.save().then(err => {
      console.log(err);
    }).catch(err => {
      console.log(err);
    })
  });
  socket.on('subscribe', function(data) {
    console.log("User:" + socket.conn.id + " IS JOINING ROOM:" + data.room);
    socket.join(data.room)
    socket.emit("message", "Successfully connected to chatroom.")
  });

  socket.on('to room', function(msg) {
    if (msg.room) {
      if (msg.room == "pi-client" && msg.type == "chat message") {
        const contentToSend = parseInt(msg.data.split("")[1]) - 1;
        var shouldGivePredefinedInput = false;
        var shouldGivePredefinedInputArgs = false;
        var hasArgs = false;
        var isArg = false;
        for (var i = 0; i < savedInputs.length; i++) {
          if (msg.data.charAt(0) == "-") {
            if(msg.data = "-help") {
            shouldGivePredefinedInputArgs = false;
          } else {
            shouldGivePredefinedInputArgs = true;
            }
          } else if(msg.data.charAt(0) == "+") {
            if(msg.data = "+help") {
            shouldGivePredefinedInput = false;
          } else {
            shouldGivePredefinedInput = true;
            }
          }
        }
        if (msg.data == "+help")
        {
          for(var i = 0;i<savedInputs.length;i++)
          {
            io.to("pi-client").emit('chat message', savedInputs[i]);
          }
        } else if(msg.data == "-help")
        {
          for(var i = 0;i<savedInputsWithArgs.length;i++)
          {
            io.to("pi-client").emit('chat message', savedInputsWithArgs[i] + " X");
            io.to("pi-client").emit('chat message', "[Without Args]");
            io.to("pi-client").emit('chat message', savedInputsNoArgs[i]);

          }
        }
        if (shouldGivePredefinedInputArgs) {
          var arg1 = "";
          if(msg.data.length>=4)
          {
           hasArgs = true;
           arg1 = msg.data.substring(3);
          }
          if(hasArgs)
          {
            io.to("pi-client").emit('chat message', savedInputsWithArgs[contentToSend] + " " + arg1);
          } else {
            io.to("pi-client").emit('chat message', savedInputsNoArgs[contentToSend]);
            }
        } else if(shouldGivePredefinedInput) {
          io.to("pi-client").emit('chat message', savedInputs[contentToSend]);
        } else {
          if (msg.data = "+help" || "-help")
          {
          } else {
            io.to("pi-client").emit('chat message', msg.data);
          }
          i
        }
      }
      } else {
        io.to(msg.room).emit(msg.type, msg.data)
      }
  });

  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  socket.on('changeBrushSize', (data) => socket.broadcast.emit('changeBrushSize', data));
  socket.on('clear whiteboard', (data) => socket.broadcast.emit('clear whiteboard', data));
});

module.exports = io;
