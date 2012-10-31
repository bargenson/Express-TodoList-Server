var express = require('express'),
	todoAdapter = require('./todo_adapter').todoAdapter,
	Todo = require('./todo').Todo;

var app = express();

app.use(express.bodyParser());

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
	todoAdapter.addTodo(
		new Todo(
			req.body.title,
			req.body.description,
			req.body.deadLine
		), function(err, index) {
			if(err) {
				res.send(400, err.message);
			} else {
				res.set('Location', '/todos/' + index);
				res.send(201);
			}
		}
	);
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

app.listen(3000);
console.log('Listening on port 3000');