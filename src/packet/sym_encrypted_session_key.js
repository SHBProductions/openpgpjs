// GPG4Browsers - An OpenPGP implementation in javascript
// Copyright (C) 2011 Recurity Labs GmbH
// 
// This library is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 2.1 of the License, or (at your option) any later version.
// 
// This library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
// 
// You should have received a copy of the GNU Lesser General Public
// License along with this library; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

var type_s2k = require('../type/s2k.js'),
	enums = require('../enums.js'),
	crypto = require('../crypto');

/**
 * @class
 * @classdesc Public-Key Encrypted Session Key Packets (Tag 1)
 * 
 * RFC4880 5.1: A Public-Key Encrypted Session Key packet holds the session key
 * used to encrypt a message. Zero or more Public-Key Encrypted Session Key
 * packets and/or Symmetric-Key Encrypted Session Key packets may precede a
 * Symmetrically Encrypted Data Packet, which holds an encrypted message. The
 * message is encrypted with the session key, and the session key is itself
 * encrypted and stored in the Encrypted Session Key packet(s). The
 * Symmetrically Encrypted Data Packet is preceded by one Public-Key Encrypted
 * Session Key packet for each OpenPGP key to which the message is encrypted.
 * The recipient of the message finds a session key that is encrypted to their
 * public key, decrypts the session key, and then uses the session key to
 * decrypt the message.
 */
module.exports = function packet_sym_encrypted_session_key() {
	this.tag = 3;
	this.sessionKeyEncryptionAlgorithm = null;
	this.sessionKeyAlgorithm = 'aes256';
	this.encrypted = null;
	this.s2k = new type_s2k();

	/**
	 * Parsing function for a symmetric encrypted session key packet (tag 3).
	 * 
	 * @param {String} input Payload of a tag 1 packet
	 * @param {Integer} position Position to start reading from the input string
	 * @param {Integer} len
	 *            Length of the packet or the remaining length of
	 *            input at position
	 * @return {openpgp_packet_encrypteddata} Object representation
	 */
	this.read = function(bytes) {
		// A one-octet version number. The only currently defined version is 4.
		this.version = bytes[0].charCodeAt();

		// A one-octet number describing the symmetric algorithm used.
		var algo = enums.read(enums.symmetric, bytes[1].charCodeAt());

		// A string-to-key (S2K) specifier, length as defined above.
		var s2klength = this.s2k.read(bytes.substr(2));

		// Optionally, the encrypted session key itself, which is decrypted
		// with the string-to-key object.
		var done = s2klength + 2;

		if(done < bytes.length) {
			this.encrypted = bytes.substr(done);
			this.sessionKeyEncryptionAlgorithm = algo
		}
		else
			this.sessionKeyAlgorithm = algo;
	}

	this.write = function() {
		var algo = this.encrypted == null ? 
			this.sessionKeyAlgorithm :
			this.sessionKeyEncryptionAlgorithm;

		var bytes = String.fromCharCode(this.version) +
			String.fromCharCode(enums.write(enums.symmetric, algo)) +
			this.s2k.write();

		if(this.encrypted != null)
			bytes += this.encrypted;
		return bytes;
	}

	/**
	 * Decrypts the session key (only for public key encrypted session key
	 * packets (tag 1)
	 * 
	 * @param {openpgp_msg_message} msg
	 *            The message object (with member encryptedData
	 * @param {openpgp_msg_privatekey} key
	 *            Private key with secMPIs unlocked
	 * @return {String} The unencrypted session key
	 */
	this.decrypt = function(passphrase) {
		var algo = this.sessionKeyEncryptionAlgorithm != null ?
			this.sessionKeyEncryptionAlgorithm :
			this.sessionKeyAlgorithm;


		var length = crypto.cipher[algo].keySize;
		var key = this.s2k.produce_key(passphrase, length);

		if(this.encrypted == null) {
			this.sessionKey = key;

		} else {
			var decrypted = crypto.cfb.decrypt(
				this.sessionKeyEncryptionAlgorithm, key, this.encrypted, true);

			this.sessionKeyAlgorithm = enums.read(enums.symmetric,
				decrypted[0].keyCodeAt());

			this.sessionKey = decrypted.substr(1);
		}
	}

	this.encrypt = function(passphrase) {
		var length = crypto.getKeyLength(this.sessionKeyEncryptionAlgorithm);
		var key = this.s2k.produce_key(passphrase, length);

		var private_key = String.fromCharCode(
			enums.write(enums.symmetric, this.sessionKeyAlgorithm)) +

			crypto.getRandomBytes(
				crypto.getKeyLength(this.sessionKeyAlgorithm));

		this.encrypted = crypto.cfb.encrypt(
				crypto.getPrefixRandom(this.sessionKeyEncryptionAlgorithm), 
				this.sessionKeyEncryptionAlgorithm, key, private_key, true);
	}
};

