
unittests.register("Packet testing", function() {

	var tests = [function() {



		var literal = new openpgp_packet_literal();
		literal.set_data('Hello world', openpgp_packet_literal.format.utf8);
		
		var enc = new openpgp_packet_symmetrically_encrypted();
		enc.data.push(literal);

		var key = '12345678901234567890123456789012',
			algo = openpgp.symmetric.aes256;

		enc.encrypt(algo, key);

		var message = new openpgp_packetlist();
		message.push(enc);


		var msg2 = new openpgp_packetlist();
		msg2.read(message.write());

		msg2.packets[0].decrypt(algo, key);

		return new test_result('Symmetrically encrypted data packet', 
			msg2.packets[0].data.packets[0].data == literal.data);
	}];

	var results = [];

	for(var i in tests) {
		results.push(tests[i]());
	}
	
	
	return results;
});
