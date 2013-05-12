
unittests.register("CAST-128 cipher test with test vectors from RFC2144", function() {
	var openpgp = require('openpgp'),
		util = openpgp.util;

	var result = new Array();
	function test_cast(input, key, output) {
		var cast5 = new openpgp.cipher.cast5(util.bin2str(key));
		var result = util.bin2str(cast5.encrypt(input));

		return util.hexstrdump(result) == util.hexstrdump(util.bin2str(output));
	};
	
	var testvectors = [[[0x01,0x23,0x45,0x67,0x12,0x34,0x56,0x78,0x23,0x45,0x67,0x89,0x34,0x56,0x78,0x9A],[0x01,0x23,0x45,0x67,0x89,0xAB,0xCD,0xEF],[0x23,0x8B,0x4F,0xE5,0x84,0x7E,0x44,0xB2]]];

	for (var i = 0; i < testvectors.length; i++) {
		result[i] = new test_result("Testing vector with block "+
				util.hexidump(testvectors[i][0])+
				" and key "+util.hexidump(testvectors[i][1])+
				" should be "+util.hexidump(testvectors[i][2]),
			test_cast(testvectors[i][1],testvectors[i][0],testvectors[i][2]));
	}
	return result;
});
