$(document).ready(function () {
  /* global io, $ */
  let socket = io();

  // Listen for user connect/disconnect announcements
  socket.on('user', function (data) {
    // Update the number of connected users
    $('#num-users').text(data.currentUsers + ' users online');

    // Announce user join/leave
    let message =
      data.username +
      (data.connected ? ' has joined the chat.' : ' has left the chat.');
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // Listen for chat messages sent by the server
  socket.on('chat message', function (data) {
    $('#messages').append($('<li>').text(data.username + ': ' + data.message));
  });

  // Form submission handler
  $('form').submit(function (e) {
    e.preventDefault(); // prevent page reload

    let messageToSend = $('#m').val();

    // Emit the chat message to the server
    socket.emit('chat message', messageToSend);

    // Clear the input box
    $('#m').val('');
    return false; // prevent form submit from reloading
  });
});
