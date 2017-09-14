var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var app = express();

// Cria Cliente Redis
// Para poder manusear as informações do BD NoSQL
var clienteRedis = redis.createClient();
// var clienteRedis = redis.createClient(13873, 
// 	'pub-redis-15617.us-west-1.1.azure.garantiadata.com:15617', 
// 	{no_ready_check: true});

// clienteRedis.auth('password', function(err){
// 	if (err) throw err;
// });

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


app.post('/livro/adicionar', function (req, res) {
	var livro = req.body.tituloLivro;
	var codigoLivro = req.body.codigoLivro;

	//rpush: insere novo elemento no fim 
	clienteRedis.rpush('tarefas', livro, function (err, reply) {
		if (err) {
			console.log(err);
		}
	});

	//rpush: insere novo elemento no fim 
	clienteRedis.rpush('lstCodigosLivros', codigoLivro, function (err, reply) {
		if (err) {
			console.log(err);
		}
	});

	//Agora vai instanciar o objeto do livro para poder editar quando quiser
	clienteRedis.hmset('livro'+codigoLivro,
	 	['codigo', codigoLivro,
		 'titulo', livro,
	 	 'autor', '',
	 	 'editora', '',
	 	 'paginas', ''],
	 	 function (err, reply) {
	 	 	if (err) {
	 			console.log(err);
	 		}
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

				clienteRedis.lrange('lstCodigosLivros', posicao -1, posicao -1, function (err, lstCodigosLivros){
					for (var PosicaoLstCodigosLivros = 0; PosicaoLstCodigosLivros < lstCodigosLivros.length; PosicaoLstCodigosLivros++){
						console.log("Codigo: " + lstCodigosLivros[PosicaoLstCodigosLivros])
						clienteRedis.del("livro"+lstCodigosLivros[PosicaoLstCodigosLivros], function(){
							if(err){
								console.log(err);
							}
						})
					}					
				});

				clienteRedis.lrem('lstCodigosLivros', 0, lstCodigosLivros[posicao], function () {
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
	livroEditado.codigo = req.body.Codigo;
	livroEditado.titulo = req.body.Titulo;
	livroEditado.autor = req.body.Autor;
	livroEditado.editora = req.body.Editora;
	livroEditado.paginas = req.body.Paginas;

	//Define vários campos para seus respectivos valores
	//Substitui todos os campos existentes no hash	
	clienteRedis.hmset('livro'+req.body.Codigo,
			[
			'codigo', livroEditado.codigo,
			'titulo', livroEditado.titulo,
			'autor', livroEditado.autor,
			'editora', livroEditado.editora,
			'paginas', livroEditado.paginas],
			function (err, reply) {
				if (err) {
					console.log(err);
				}
				res.redirect('/');
			});
});

app.post('/livro/buscar', function (req, res) {
	var titulo = 'Lista de Livros';
	var codigoLivroBuscado = req.body.CodigoBuscado;

	clienteRedis.lrange('tarefas', 0, -1, function (err, tarefas) {
	clienteRedis.hgetall('livro'+codigoLivroBuscado, function (err, livroBuscado) {
		res.render('tarefas', {
			  tarefas: tarefas,
			  titulo: titulo,
			  livro : livroBuscado
			});
		});
	});	
});

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), function() {
	console.log('Servidor Inicializado na Porta', app.get('port'));
});	

module.exports = app;