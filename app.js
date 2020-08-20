/*eslint-env node*/
require('dotenv').config();
const express = require('express');
const cfenv = require('cfenv');
const request = require('request');
const fs = require('fs');
const multer  = require('multer');
const upload = multer();

const TextToSpeechV1 = require('watson-developer-cloud/text-to-speech/v1');
const AssistantV2 = require('ibm-watson/assistant/v2');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

const assistant = new AssistantV2({
  version: '2019-02-28',
  iam_apikey: process.env.ASSISTANT_APIKEY,
  url: process.env.ASSISTANT_URL
});

const assistant_id = process.env.ASSISTANT_ID;
let session_id;

const textToSpeech = new TextToSpeechV1({
  iam_apikey: process.env.TEXT_TO_SPEECH_IAM_APIKEY,
  url: process.env.TEXT_TO_SPEECH_URL
});

const speechToText = new SpeechToTextV1({
  iam_apikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY,
  url: process.env.SPEECH_TO_TEXT_URL
});

var app = express();
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const audioFile = __dirname + '/public/uploads/';

app.get('/', function(req, res){
  res.render('index.html');
});

app.get('/phone', function(req, res){
  res.render('phone.html');
});

app.get('/advisor', function(req, res){
  res.render('advisor.html');
});

app.get('/control', function(req, res){
  res.render('control.html');
})

function saveClientAudio(file, callback){
  fs.writeFileSync(audioFile + 'clientAudio.wav', Buffer.from(new Uint8Array(file)));
  callback(200);
}

function deleteClientAudio(callback){
   fs.unlinkSync(audioFile + 'clientAudio.wav');
   callback(200);
}

app.post('/upload', upload.single('soundBlob'), function (req, res, next) {
  saveClientAudio(req.file.buffer, (status) =>{
    res.sendStatus(status);
  });
});


// TODO: Multiple answer implementation
app.get('/sendToWatsonAssistant', function(req, res){
  var message = req.query.text;
  message = message.replace(/(\r\n|\n|\r)/gm, "");
  if(!session_id){
    assistant.createSession({
      assistant_id: assistant_id
    })
    .then(res_session => {
      session_id = res_session.session_id;
      assistant.message({
        assistant_id: assistant_id,
        session_id: session_id,
        input: {
          'message_type': 'text',
          'text': message,
          'options': {
              'return_context': true
            }
          }
        })
        .then(res_watson => {
          res.json(transformWatsonResult(res_watson.output.generic, res_watson.context));
          //res.send(res_watson.output.generic[0].text);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
  }else{
    assistant.message({
      assistant_id: assistant_id,
      session_id: session_id,
      input: {
        'message_type': 'text',
        'text': message,
        'options': {
            'return_context': true
          }
        }
      })
      .then(res_watson => {
        res.json(transformWatsonResult(res_watson.output.generic, res_watson.context));
        //res.send(res_watson.output.generic[0].text);
      })
      .catch(err => {
        console.log(err);
      });
  }



});

function transformWatsonResult(res, context){
  var customer = [];
  var advisor = [];
  res.forEach( ele => {
    customer.push(ele.text.split(' | ')[0]);
    advisor.push(ele.text.split(' | ')[1]);
  });
  return {
    customer: customer,
    advisor: advisor,
    context: context
  }
}

//Text to Speech
app.get('/sendVoice', function(req, res){
  let text = req.query.text;
  let synthesizeParams = {
    text: text,
    accept: 'audio/wav',
    voice: 'fr-FR_ReneeV3Voice',
  };

  textToSpeech.synthesize(synthesizeParams)
    .then(audio => {
      audio.pipe(res);
    })
    .catch(err => {
      console.log('error:', err);
      res.sendStatus(500);
    });
});

// Display events on the console.
function onEvent(name, event) {
  console.log(name, JSON.stringify(event, null, 2));
};


//Speech to Text : Transcription audio Client
app.get('/transcriptClientAudio', function(req, res) {
  var files = [audioFile + 'clientAudio.wav'];
  for (var file in files) {
    var params = {
        audio: fs.createReadStream(files[file]),
        content_type: 'audio/wav',
        model: 'fr-FR_BroadbandModel',
        //timestamps: true,
        //word_alternatives_threshold: 0.9,
        //keywords: ['bonjour'],
        //keywords_threshold: 0.5
      };
    speechToText.recognize(params, function (error, transcript) {
    if (error) {
      console.log('error:', error);
    }
    if (!transcript.results) {
      res.json('');
    }    
    else
        res.json(transcript.results[0].alternatives[0].transcript);
  });
  };
});


var appEnv = cfenv.getAppEnv();

var server = app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("server starting on " + appEnv.url);
});

var io = require('socket.io').listen(server);
io.on('connection', function(socket){
  socket.on('watson message', function(msg){
    io.emit('watson message', msg);
  });
  socket.on('client message', function(msg){
    io.emit('client message', msg);
  });
  socket.on('end conversation', function(msg){
    io.emit('end conversation', msg);
    session_id = null;
  });
  socket.on('options', function(options){
    io.emit('options', options);
  });
  socket.on('adviser answer', function(msg){
    io.emit('adviser answer', msg);
  });
  socket.on('start recording', function(msg){
    io.emit('start recording', msg);
  });
  socket.on('stop recording', function(msg){
    io.emit('stop recording', msg);
  });
  socket.on('reload', function(msg){
    session_id = null;
    io.emit('reload', msg);
  });
  socket.on('auto recording', function(msg){
    if(msg === "true")
      io.emit('auto recording', true);
    else
      io.emit('auto recording', false);
  });
});

