import test from 'node:test';import assert from 'node:assert/strict';
import {hashPassword,verifyPassword} from '../lib/password';
import {transitions} from '../lib/request-status';
import {checkOrigin,HttpError,jsonBody} from '../lib/http';
test('passwords are salted and reject wrong or legacy plaintext credentials',()=>{const a=hashPassword('test-password-123'),b=hashPassword('test-password-123');assert.notEqual(a,b);assert.ok(verifyPassword('test-password-123',a));assert.equal(verifyPassword('wrong-password',a),false);assert.equal(verifyPassword('admin123','admin123'),false)});
test('completed and cancelled requests cannot be reopened',()=>{assert.deepEqual(transitions.COMPLETED,[]);assert.deepEqual(transitions.CANCELLED,[]);assert.ok(!transitions.NEW.includes('COMPLETED'))});
test('cross-origin mutations are rejected',()=>{assert.throws(()=>checkOrigin(new Request('http://localhost:3000/api/test',{headers:{origin:'https://untrusted.invalid'}})),HttpError);assert.throws(()=>checkOrigin(new Request('http://localhost:3000/api/test',{headers:{'sec-fetch-site':'cross-site'}})),HttpError)});
test('malformed JSON becomes a controlled client error',async()=>{await assert.rejects(()=>jsonBody(new Request('http://localhost:3000/api/test',{method:'POST',headers:{'content-type':'application/json'},body:'{broken'})),(e:unknown)=>e instanceof HttpError&&e.status===400)});
