
module.exports = {
	des: require('./des.js'),
	cast5: require('./cast5.js'),
	twofish: require('./twofish.js'),
	blowfish: require('./blowfish.js')
}

var aes = require('./aes.js');

for(var i in aes) {
	module.exports['aes' + i] = aes[i];
}
