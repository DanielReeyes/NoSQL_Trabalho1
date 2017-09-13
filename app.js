var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var app = express();

// Cria Cliente Redis
// Para poder manusear as informações do BD NoSQL
var clienteRedis = redis.createClient();

clienteRedis.on('connect', function () {
	console.log('Conexão ao Servidor Redis OK!');
});

// Configuração do Renderizador de Páginas (EJS)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Captura o caminho '/' na URL
///app.get('/', function (req, res) {
///    var titulo = 'Lista de Livros';

//lrange: Retorna os elementos especificados na lista 'Tarefas'
///    clienteRedis.lrange('tarefas', 0, -1, function (err, tarefas) {
//hgetall: Obtém todos os campos e valores em um hash
//hgetall: Retorna cada nome de campo seguido de seu valor
///		clienteRedis.hgetall('contato', function(err, contato){
///			res.render('tarefas', {
///				titulo: titulo,
///				tarefas: tarefas,
///				contato: contato
///			});
///		});
///    });
///});

// Captura o caminho '/' na URL
app.get('/', function (req, res) {
	var titulo = 'Lista de Livros';

	//lrange: Retorna os elementos especificados na lista 'Tarefas'
	clienteRedis.lrange('tarefas', 0, -1, function (err, tarefas) {
		//hgetall: Obtém todos os campos e valores em um hash
		//hgetall: Retorna cada nome de campo seguido de seu valor
		//clienteRedis.hgetall('livro', function (err, livro) {
		clienteRedis.hgetall('livro2', function (err, livro) {
			res.render('tarefas', {
				titulo: titulo,
				tarefas: tarefas,
				livro: livro
			});
		});
	});
});


app.post('/tarefa/adicionar', function (req, res) {
	var livro = req.body.tituloLivro;
	var codigoLivro = req.body.codigoLivro;

	//rpush: insere novo elemento no fim 
	clienteRedis.rpush('tarefas', livro, function (err, reply) {
		if (err) {
			console.log(err);
		}
		console.log('Livro ' + livro + ' Adicionado ...');
	//	res.redirect('/');
	});

	//Agora vai instanciar o objeto do livro para poder editar quando quiser
	clienteRedis.hmset('livro'+codigoLivro,
	 	['titulo', livro,
	 	 'autor', '',
	 	 'editora', '',
	 	 'paginas', ''],
	 	function (err, reply) {
	 		if (err) {
	 			console.log(err);
	 		}
			 //console.log(reply);
			 console.log('Objeto criado')
	 		res.redirect('/');
	 	});
});

app.post('/tarefa/remover', function (req, res) {
	//pega todas as tarefas que estão marcadas na tela para serem removidas
	var tarefasParaRemover = req.body.tarefas;

	//lrange: Retorna os elementos especificados na lista 'Tarefas'
	clienteRedis.lrange('tarefas', 0, -1, function (err, tarefas) {
		for (var posicao = 0; posicao < tarefas.length; posicao++) {
			//verifica se a posicao da tarefa na lista de tarefas consta na lista de tarefas a serem removidas
			if (tarefasParaRemover.indexOf(tarefas[posicao]) > -1) {
				//caso esteja, remove da lista de tarefas
				//lrem: Remove as primeiras ocorrências de contagem de elementos iguais ao valor da lista armazenada na chave
				clienteRedis.lrem('tarefas', 0, tarefas[posicao], function () {
					if (err) {
						console.log(err);
					}
				});
			}
		}
		res.redirect('/');
	});
});

app.post('/livro/editar', function (req, res) {
	var livroEditado = {};

	//Monta um objeto com as informacoes que há na tela
	livroEditado.Codigo = req.body.Codigo;
	livroEditado.Titulo = req.body.Titulo;
	livroEditado.Autor = req.body.Autor;
	livroEditado.Editora = req.body.Editora;
	livroEditado.Paginas = req.body.Paginas;

	//Define vários campos para seus respectivos valores
	//Substitui todos os campos existentes no hash	
	clienteRedis.hmset('livro'+req.body.Codigo,
			[
			'Titulo', livroEditado.nome,
			'Autor', livroEditado.companhia,
			'Editora', livroEditado.telefone,
			'Paginas', livroEditado.telefone],
		function (err, reply) {
			if (err) {
				console.log(err);
			}
			console.log(reply);
			res.redirect('/');
		});
});

app.post('/livro/buscar', function (req, res) {
	var titulo = 'Teste';
	var codigoLivroBuscado = req.body.CodigoBuscado;
	console.log('Livro buscado livro'+codigoLivroBuscado)

	clienteRedis.lrange('tarefas', 0, -1, function (err, tarefas) {
	clienteRedis.hgetall('livro'+codigoLivroBuscado, function (err, livroBuscado) {
		res.render('tarefas', {
		//	livro: livro,
		//	titulo: titulo//,
		tarefas: tarefas,
		//});
		titulo: titulo,
		livro : livroBuscado
			});
		});
	});	
});

app.listen(3000);
console.log('Servidor Inicializado na Porta 3000 ...',
	'URL: http://localhost:3000/');

module.exports = app;