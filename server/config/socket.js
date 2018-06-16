var io = require('socket.io')();
const colors = require('colors');
const ResponseModel = require('../models/response.js');

var savedInputs = ["this will be the first entry", "this wil be the second entry", "this will be the third entry", "Justin got this feature working", "Justin made this function work. Thank him sometime."];

io.on('connection', function(socket) {

  // io.emit('chat message', "Use the number's to enter prerecorded text")
  // for (var i = 0; i < savedInputs.length; i++) {
  //   io.emit('chat message', (i + 1) + " " + savedInputs[i])
  // }

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

  // Quick commands is an array of objects, each with a default response and a custom response
  let QuickCommands = [
    {
      defaultText: "Welcome to class!",
      customText: "Welcome to class 1! I hope you're feeling 2"
    }, {}, {}
  ];

  socket.on("pi room chat message", function(msg) {
    console.log("pi room chat message sent");
    let text_response;
    if (isQuickCommand(msg)) {
      const quickCommandIndex = parseInt(msg.charAt(1)) - 1;
      const quickCommandArguments = getArgumentsFromMessage(msg);
      if (quickCommandArguments.length > 0) {
        text_response = QuickCommands[quickCommandIndex].customText;
        console.log(text_response);
        for (var i = 1; i <= quickCommandArguments.length; i++) {
          const regex = new RegExp(`${i}`, "g");
          text_response = text_response.replace(regex, quickCommandArguments[i - 1]);
        }
      } else {
        text_response = QuickCommands[quickCommandIndex].defaultText;
      }
      io.to("pi-client").emit("pi room chat message", text_response)
      io.to("pi-client").emit("robot speak command", text_response)
    } else {
      io.to("pi-client").emit("pi room chat message", msg)
      io.to("pi-client").emit("robot speak command", msg)
    }
    // HELPER FUNCTIONS ##########
    function isQuickCommand(message) {
      // Quick commands need to have a "-" character and they need to exist in the QuickCommands array
      return message.startsWith("-") && (QuickCommands[message.charAt(1)] != undefined);
    }

    function getArgumentsFromMessage(message) {
      // creates an array of strings from the original with the space character being the separator.catch
      // "-1 Elliot" would become ["-1", "Elliot"]
      const messageParts = message.split(" ");
      if (messageParts.length < 2) {
        // if the message doesn't have at least 2 parts there aren't any arguments available
        return false;
      } else {
        // returns all strings in the message parts except for the first one
        return messageParts.slice(1);
      }
    }
    // END OF HELPER FUNCTIONS ######################
  }); // end of pi room chat message

  socket.on('to room', function(msg) {
    console.log(msg);
    if (msg.room) {
      if (msg.room == "pi-client" && msg.type == "chat message") {
        var shouldGivePredefinedInput = false;
        for (var i = 0; i < savedInputs.length; i++) {
          if (msg.data == "-" + (
          i + 1)) {
            shouldGivePredefinedInput = true;
          }
        }
        if (shouldGivePredefinedInput) {
          const contentToSend = parseInt(msg.data.split("")[1]) - 1;
          console.log(contentToSend)
          io.to("pi-client").emit('chat message', savedInputs[contentToSend]);
        } else {
          io.to("pi-client").emit('chat message', msg.data);
        }
      } else {
        io.to(msg.room).emit(msg.type, msg.data)
      }
    }
  });

  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  socket.on('changeBrushSize', (data) => socket.broadcast.emit('changeBrushSize', data));
  socket.on('clear whiteboard', (data) => socket.broadcast.emit('clear whiteboard', data));
});

module.exports = io;
