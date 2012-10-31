function Todo(title, description, deadLine) {
	this.title = title;
	this.description = description;
	this.deadLine = deadLine;
	
	this.isValid = function() {
		return isDefined(this.title) &&
					isDefined(this.description) &&
						isDefined(this.deadLine);
	};

	function isDefined(value) {
		return (typeof value !== 'undefined');
	}

}

exports.Todo = Todo;