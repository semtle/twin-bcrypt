/* jshint expr: true */
/* global chai, describe, it, expect, TwinBcrypt */

/**
 * A trivial spy function.
 * Also check https://github.com/chaijs/chai-spies
 */
function Spy() {
    var count = 0;
    var sp = function() {
        count++;
    };
    sp.should = {
        have: {
            been: {
                called: function() {
                    count.should.be.above(1);
                }
            }
        }
    };
    return sp;
}



describe('API test suite', function() {

    describe('Salt', function() {
        var COST_4_SALT = /^\$2a\$04\$[.\/A-Za-z0-9]{21}[.Oeu]$/;
        var DEFAULT_SALT = new RegExp('^\\$2a\\$'+TwinBcrypt.defaultCost+'\\$[./A-Za-z0-9]{21}[.Oeu]$');

        it('should have a decent default cost parameter', function() {
            TwinBcrypt.defaultCost.should.be.within(10, 15);
        });

        it('should accept explicit cost parameter', function() {
            TwinBcrypt.genSalt(4).should.match(COST_4_SALT, 'as integer');
            TwinBcrypt.genSalt(4.8).should.match(COST_4_SALT, 'as float');
            TwinBcrypt.genSalt('4').should.match(COST_4_SALT, 'as string');
        });

        it('should be generated with default cost parameter', function() {
            TwinBcrypt.genSalt().should.match(DEFAULT_SALT);
        });

        it('should reject bad cost parameter', function() {
            expect(function() { TwinBcrypt.genSalt("abc"); }).to.throw(Error, /cost|rounds/, 'string');
            expect(function() { TwinBcrypt.genSalt(-1); }).to.throw(Error, /cost|rounds/, 'negative');
            expect(function() { TwinBcrypt.genSalt(0); }).to.throw(Error, /cost|rounds/, 'zero');
            expect(function() { TwinBcrypt.genSalt(3); }).to.throw(Error, /cost|rounds/, 'too low');
            expect(function() { TwinBcrypt.genSalt(32); }).to.throw(Error, /cost|rounds/, 'too high');
        });
    });

    describe('Hash', function() {
        var SALT4 = '$2a$04$......................',
            SALT7 = '$2a$07$......................',
            HASH4 = '$2a$04$......................LAtw7/ohmmBAhnXqmkuIz83Rl5Qdjhm',
            HASH7 = '$2a$07$......................rkNUWThr5KSHevvQDxRDSYaalST.SGy',
            COST_4_HASH = /^\$2a\$04\$[.\/A-Za-z0-9]{21}[.Oeu][.\/A-Za-z0-9]{30}[.CGKOSWaeimquy26]$/,
            COST_7_HASH = /^\$2a\$07\$[.\/A-Za-z0-9]{21}[.Oeu][.\/A-Za-z0-9]{30}[.CGKOSWaeimquy26]$/,
            DEFAULT_HASH = new RegExp('^\\$2a\\$'+TwinBcrypt.defaultCost+'\\$[./A-Za-z0-9]{21}[.Oeu][.\/A-Za-z0-9]{30}[.CGKOSWaeimquy26]$'),
            noop = function() {};

        describe('Synchronous', function() {
            it('should warn when no password is given', function() {
                expect(function() { TwinBcrypt.hashSync(); }).to.throw(Error, /password|data|argument/);
            });

            it('should be generated with explicit salt', function() {
                TwinBcrypt.hashSync('password', SALT4).should.equal(HASH4);
                TwinBcrypt.hashSync('', SALT4).should.equal('$2a$04$......................w74bL5gU7LSJClZClCa.Pkz14aTv/XO');
            });

            it('should be generated with salt given as a number', function() {
                TwinBcrypt.hashSync('password', 4).should.match(COST_4_HASH, 'as integer');
                TwinBcrypt.hashSync('password', 4.8).should.match(COST_4_HASH, 'as float');
                expect(function() {
                    TwinBcrypt.hashSync('password', '4');
                }).to.throw(Error, /salt/, 'as string');
            });

            it('should be generated with default salt generation', function() {
                TwinBcrypt.hashSync('password').should.match(DEFAULT_HASH);
            });
        });


        describe('Asynchronous', function() {
            it('should warn when no password is given', function() {
                expect(function() { TwinBcrypt.hash(noop); }).to.throw(Error, /password|data|argument/, '1 argument');
                expect(function() { TwinBcrypt.hash(undefined, noop); }).to.throw(Error, /password|data|argument/, '2 arguments');
                expect(function() { TwinBcrypt.hash(undefined, SALT4, noop); }).to.throw(Error, /password|data|argument/, '3 arguments');
                expect(function() { TwinBcrypt.hash(undefined, SALT4, noop, noop); }).to.throw(Error, /password|data|argument/, '4 arguments');
            });

            it('should warn when no callback is given', function() {
                expect(function() { TwinBcrypt.hash('password', SALT4); }).to.throw(Error, /callback/);
            });

            it('should accept (password, callback)', function(done) {
                TwinBcrypt.hash('password', function(error, result) {
                    expect(error).to.not.exist;
                    result.should.match(DEFAULT_HASH);
                    done();
                });
            });

            it('should accept (password, string_salt, callback)', function(done) {
                TwinBcrypt.hash('password', SALT4, function(error, result) {
                    expect(error).to.not.exist;
                    result.should.equal(HASH4);
                    done();
                });
            });
            
            it('should accept (password, number_salt, callback)', function(done) {
                TwinBcrypt.hash('password', 4, function(error, result) {
                    expect(error).to.not.exist;
                    result.should.match(COST_4_HASH);
                    done();
                });
            });

            it('should accept (password, progress, callback)', function(done) {
                var spy = Spy();
                TwinBcrypt.hash('password', spy, function(error, result) {
                    expect(error).to.not.exist;
                    result.should.match(DEFAULT_HASH);
                    spy.should.have.been.called();
                    done();
                });
            });

            it('should accept (password, string_salt, progress, callback)', function(done) {
                var spy = Spy();
                TwinBcrypt.hash('password', SALT7, spy, function(error, result) {
                    expect(error).to.not.exist;
                    result.should.equal(HASH7);
                    spy.should.have.been.called();
                    done();
                });
            });

            it('should accept (password, number_salt, progress, callback)', function(done) {
                var spy = Spy();
                TwinBcrypt.hash('password', 7, spy, function(error, result) {
                    expect(error).to.not.exist;
                    result.should.match(COST_7_HASH);
                    spy.should.have.been.called();
                    done();
                });
            });

            it('should warn when arguments are invalid', function() {
                expect(function() { TwinBcrypt.hash('password', noop, noop, SALT4); }).to.throw(Error, /salt|callback|argument/);
            });

            it('should reject an invalid salt', function(done) {
                TwinBcrypt.hash('password', '$2a$04$.............', function(error, result) {
                    expect(error).to.match(/salt/);
                    expect(result).to.not.exist;
                    done();
                });
            });

        });
    });


/*
compareSync(data, encrypted)

    data - [REQUIRED] - data to compare.
    encrypted - [REQUIRED] - data to be compared to.

compare(data, encrypted, cb)

    data - [REQUIRED] - data to compare.
    encrypted - [REQUIRED] - data to be compared to.
    callback - [REQUIRED] - a callback to be fired once the data has been compared.
        error - First parameter to the callback detailing any errors.
        result - Second parameter to the callback providing whether the data and encrypted forms match [true | false].

*/

});
