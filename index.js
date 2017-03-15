const fs = require('fs');
const os = require('os');
const _ = require("lodash");
const request = require("request");
const Transform = require("stream").Transform;

const END_OF_JSON_OBJECT = '}';

function _isItANewObject(sourceCity){
    return _.isEmpty(this.current) && _.endsWith(sourceCity, END_OF_JSON_OBJECT);
}

function _isNotItANewObject(sourceCity){
    return !_.isEmpty(this.current) && _.endsWith(sourceCity, END_OF_JSON_OBJECT);
}

function _lowerCityName(city) {
    city.city = _.lowerCase(city.city);
    return city + os.EOL;
}

class ToLower extends Transform {

    // surchargeons la méthode _transform
    _transform(chunk, encoding, done) {
        const sourceObjects = _.split(chunk.toString(), os.EOL);
        
        _.forEach(sourceObjects, (sourceCity) => {
            // attention un chunk peut s'arrêter en plein milieu d'un objet
            // d'où la mémorisation de la dernière ligne lue pour pouvoir
            // continuer le traitement dès le prochain chunk reçu
            if(!_.isEmpty(this.current) && _.endsWith(sourceCity, END_OF_JSON_OBJECT)){
                const city = this.current + sourceCity;
                this.push(_lowerCityName(city));
                this.current = undefined;
            } else if(_.endsWith(sourceCity, END_OF_JSON_OBJECT)){
                this.push(_lowerCityName(sourceCity));
            } else {
                this.current = sourceCity;
            }
        });
        done();
    }
}

request
    .get('http://media.mongodb.org/zips.json?_ga=1.101475329.1020165022.1488921606')
    .pipe(new ToLower())
    .pipe(fs.createWriteStream('./output'));