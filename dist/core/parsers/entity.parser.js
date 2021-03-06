"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.EntityParser = void 0;
var lodash_1 = require("lodash");
var parser_1 = require("./parser");
/**
 * Parser for table attributes like: column name and table name.
 */
var EntityParser = /** @class */ (function (_super) {
    __extends(EntityParser, _super);
    function EntityParser() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'entity';
        _this.description = 'Parser for table attributes, like column name and table name.';
        return _this;
    }
    EntityParser.prototype.parse = function (val) {
        if (!lodash_1.isString(val)) {
            throw new Error('EntityParser received invalid value. Valid values are: string. Received value:' + val);
        }
        return this.addQuotesForEntities(val);
    };
    return EntityParser;
}(parser_1.Parser));
exports.EntityParser = EntityParser;
