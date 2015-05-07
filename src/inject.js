module.exports = function (chunk) {
	for (var i = 0; i < chunk.length - 1; i++) {
		if (chunk[i] == 100 && chunk[i + 1] == 62) { // find d>
			return i + 1
		}
	}
	return -1
}