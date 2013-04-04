Array.prototype.remove = function(item) {
	for(var i = 0; i < this.length; i++) {
        if(this[i] === item) {
            this.splice(i, 1);
            break;
        }
    }
};


var express = require('express'),
	todoAdapter = require('./todo_adapter').todoAdapter,
	Todo = require('./todo').Todo,
	connections = [],
	sseDataId = 0;

var app = express();

addMiddlewares();

app.options("*", function(req, res) {
	res.header('Allow', 'GET,POST,OPTIONS');
	res.send(200);
});

app.get('/todos', function(req, res){
	todoAdapter.getTodos(function(err, result) {
		if(err) {
			res.send(500, err.message);
		} else {
			res.json({ todos: result });
		}
	});
});

app.post('/todos', function(req, res){
	var todo = new Todo(
		req.body.title,
		req.body.description,
		req.body.deadLine
	);
	todoAdapter.addTodo(todo, function(err, index) {
		if(err) {
			res.send(400, err.message);
		} else {
			res.set('Location', '/todos/' + index);
			res.send(201, JSON.stringify({ todoId: index }));
			sendNewTodoToStream(todo);
		}
	});
});

app.get('/todos/:id', function(req, res){
	var todoId = req.params.id;
	todoAdapter.getTodo(req.params.id, function(err, result) {
		if(err) {
			res.send(500, err.message);
		} else if(result) {
			res.json(result);
		} else {
			res.send(404, "The todo with ID=" + todoId + " doesn't exist.");
		}
	});
});

app.get('/stream', function(req, res) {
	if(runOnHeroku()) {
		res.send(500, "SSE is not supported on Heroku. Use the local version instead.");
	} else {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache'
		});
		res.write('id\n\n');
		addToStream(req, res);
	}
});

startListen();

function startListen() {
	var port = process.env.PORT || 3000;
	app.listen(port, function() {
		console.log('Listening on port 3000');
	});
}

function addMiddlewares() {
	app.use(express.bodyParser());
	app.use(addCorsHeaders);
}

function addCorsHeaders(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With,Accept,Connection,Pragma,Cache-Control');

    next();
}

function addToStream(req, res) {
	var clear = function() {
		res.end();
		connections.remove(res);
	};
	req.on('timeout', clear);
	req.on('error', clear);
	req.on('close', clear);
	connections.push(res);
}

function sendNewTodoToStream(todo) {
	sseDataId++;
	connections.forEach( function(response) {
		response.write("id: " + sseDataId + "\n");
		response.write("data: " + JSON.stringify(todo) + "\n\n");
	});
}

function runOnHeroku() {
	return process.env.PORT;
}
