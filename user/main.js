// recuperamos el valor
const userId = document.getElementById("userId").dataset.value;
console.log(userId);

let pokeDiv = document.getElementById("pokePlay");
let max = 10;
let pedidos = 0;

let connection;
let turn = 0;

// Conectar al WebSocket
function connectWebSocket() {
	connection = new WebSocket("ws://localhost:8080/", "echo-protocol");

	connection.onopen = () => {
		console.log("WebSocket Client Connected");
	};

	connection.onerror = (error) => {
		console.log("Connection Error: " + error);
	};

	connection.onclose = () => {
		console.log("Connection Closed");
	};

	connection.onmessage = (message) => {
		if (message.data) {
			const data = JSON.parse(message.data);

			if (data.type === "attack" && data.user !== userId && data.first === 0) {
				console.log(recived);
				if (!recived) receive(data.damage);
			} else if (data.type === "selected_team" && data.user !== userId) {
				create_enemys(data);
			} else if (data.type === "turn") {
				recived = false;
				turn = data.turn;
				updateTurn(false);
			}
		}
	};
}

connectWebSocket();

let enemy_team = [];
const enemy_space = document.getElementById("enemyPlay");

function create_enemys(user) {
	if (enemy_team.length >= 5) return;
	user = user["team"];
	enemy_space.innerHTML = "";
	for (let i = 0; i < user.length; i++) {
		let poke = new Pokemon(
			user[i]["name"],
			user[i]["hp"],
			user[i]["atack"],
			user[i]["img"],
			"enemy",
		);
		enemy_team.push(poke);

		paint_pokemon(enemy_team[i], "enemy");
	}
}

// Función para obtener un número aleatorio para los pokemons
function random() {
	return Math.floor(Math.random() * 100);
}

// Función para pedir la cantidad de pokemons
document.getElementById("getPokemon").addEventListener("click", () => {
	pokeDiv.innerHTML = "";
	let quantity = document.getElementById("poke_num").value;
	if (quantity == "") {
		quantity = 10;
	}
	if (quantity - pedidos > 5) {
		quantity = quantity - pedidos;
	} else {
		quantity = 5;
	}
	let repePoke = [];
	pokemons_player = [];
	for (let i = 0; i < quantity; i++) {
		get_pokemons(repePoke);
	}

	pedidos++;
	document.getElementById("info_continue").innerHTML =
		"<p>Seleccione 5 pokemons para iniciar partida</p>";
});

// Función para obtener los datos del pokemon
async function get_pokemons(repePoke) {
	fetch("https://pokeapi.co/api/v2/pokemon/" + random())
		.then((x) => x.json())
		.then((y) => {
			if (!repePoke.includes(y.name)) {
				create_pokemon(y);
				repePoke.push(y.name);
			} else {
				get_pokemons(repePoke);
			}
		});
}

// Lista de pokemons del jugador
let pokemons_player = [];

// Crear un pokemon
function create_pokemon(pokemon) {
	let poke = new Pokemon(
		pokemon["name"],
		pokemon["stats"]["0"]["base_stat"] + pokemon["stats"]["2"]["base_stat"],
		pokemon["stats"]["1"]["base_stat"],
		pokemon["sprites"]["front_default"],
		"user",
	);
	if (!pokemons_player.some((p) => p.name === poke.name)) {
		pokemons_player.push(poke);
		paint_pokemon(poke);
	}
}

// Pintar un pokemon en el DOM
function paint_pokemon(pokemon, user) {
	const temp = document.getElementById("template");
	const clonedTemplate = temp.content.cloneNode(true);
	let pokeSection = clonedTemplate.getElementById("pokemon");
	let nombre = clonedTemplate.getElementById("name");
	let link = clonedTemplate.getElementById("info");
	let atributes = clonedTemplate.getElementById("atributes");
	atributes.innerText = pokemon.hp + " / " + pokemon.atack;
	nombre.innerText = pokemon.name;
	link.src = pokemon.img;
	pokeSection.id = pokemon.name;
	if (!user) {
		pokeSection.onclick = () => {
			make_deck(pokemon.name, pokemon.player);
		};
	} else {
		pokeSection.style.backgroundcolor = "red";
	}
	(!user ? pokeDiv : enemy_space).appendChild(clonedTemplate);
}

// Constructor para el Pokemon
function Pokemon(name, hp, atack, img, player) {
	this.name = name;
	this.atack = atack;
	this.img = img;
	this.hp = hp;
	this.player = player;
}

Pokemon.prototype.takedamage = function (damage) {
	let poke = this.player === "enemy" ? enemy_team : pokemons_player;
	this.hp -= damage;
	if (this.hp <= 0) {
		const index = poke.findIndex((x) => x.name === this.name);
		if (index !== -1) {
			poke.splice(index, 1);
		}
	}
};

// Selector de pokemons para crear el equipo
function make_deck(id) {
	let marked = document.querySelectorAll("#" + id);
	if (marked.length > 1) {
		marked[1].classList.toggle("selected");
	} else {
		marked[0].classList.toggle("selected");
	}
	const selected = document.getElementsByClassName("selected").length;
	if (selected == 5) {
		const boton = document.createElement("button");
		boton.innerText = "Seleccionar equipo";
		boton.id = "sendSelected";
		boton.onclick = function () {
			save_team();
		};
		document.getElementById("info_continue").appendChild(boton);
	} else {
		if (document.getElementById("sendSelected")) {
			document.getElementById("sendSelected").remove();
		}
	}
}

// Guardar el equipo seleccionado
function save_team() {
	let temp_list = [];
	const selected = document.getElementsByClassName("selected");
	for (let i = 0; i < selected.length; i++) {
		for (let x = 0; x < pokemons_player.length; x++) {
			if (pokemons_player[x].name == selected[i].id) {
				temp_list.push(pokemons_player[x]);
			}
		}
	}
	pokemons_player = temp_list;
	document.getElementById("pokePlay").innerHTML = "";
	document.getElementById("info_continue").innerHTML = "";
	document.getElementsByClassName("selector")[0].style.display = "none";
	for (let i = 0; i < pokemons_player.length; i++) {
		paint_pokemon(pokemons_player[i]);
	}
	if (connection && connection.readyState === WebSocket.OPEN) {
		connection.send(
			JSON.stringify({
				type: "selected_team",
				team: pokemons_player,
				user: userId,
			}),
		);
		console.log("Pokemon send");
	}

	const attackButton = document.createElement("button");
	attackButton.innerText = "Atacar";
	attackButton.id = "attackButton";
	attackButton.onclick = attack;
	document.getElementById("info_continue").appendChild(attackButton);
}

// nos connectamos cuando la pag se cargue
window.onload = () => {
	connectWebSocket();
};

// Función para atacar

function attack() {
	let valid = 0;
	if (turn % 2 === 0) {
		const selectedPokemon = document.getElementsByClassName("selected")[0];
		if (selectedPokemon) {
			const pokemonName = selectedPokemon.id;
			const pokemon = pokemons_player.find((poke) => poke.name === pokemonName);

			if (connection && connection.readyState === WebSocket.OPEN) {
				connection.send(
					JSON.stringify({
						type: "attack",
						damage: pokemon.atack,
						user: userId,
						pokemon: pokemon.name,
						first: valid,
					}),
				);
				valid++;
				turn++;
				updateTurn(true);
				recived = false;
				receive(pokemon.atack, true);
				attackProcessed = true;
			}
		} else {
			alert("Selecciona un Pokémon para atacar.");
		}
	} else {
		alert("Es el turno del otro jugador.");
	}
}

function updateTurn(repe) {
	recived = false;
	const attackButton = document.getElementById("attackButton");
	if (turn % 2 === 0) {
		attackButton.style.display = "block";
	} else {
		attackButton.style.display = "none";
	}

	if (connection && connection.readyState === WebSocket.OPEN && repe) {
		connection.send(
			JSON.stringify({
				type: "turn",
				turn: turn,
				user: userId,
			}),
		);
	}
}

let recived = false;

// funcion recibir danyo
function receive(damage, enemy) {
	if (recived) return;
	let selectedPokemon;

	if (enemy) {
		enemy_space.innerHTML = "";
		selectedPokemon = enemy_team[0];
	} else {
		pokeDiv.innerHTML = "";
		selectedPokemon = pokemons_player[0];
	}

	if (selectedPokemon) {
		selectedPokemon.takedamage(damage);
	}
	updateTeamDisplay();
	checkGameOver();
	recived = true;
}

function updateTeamDisplay() {
	pokeDiv.innerHTML = "";
	enemy_space.innerHTML = "";
	pokemons_player.forEach((pokemon) => {
		if (pokemon.hp > 0) {
			paint_pokemon(pokemon);
		}
	});

	enemy_team.forEach((pokemon) => {
		if (pokemon.hp > 0) {
			paint_pokemon(pokemon, "enemy");
		}
	});
}

// comprueba si se acabo el juego
function checkGameOver() {
	const playerAlive = pokemons_player.some((pokemon) => pokemon.hp > 0);
	const enemyAlive = enemy_team.some((pokemon) => pokemon.hp > 0);

	if (!playerAlive) {
		showEndMessage("¡El enemigo ha ganado!");
	} else if (!enemyAlive) {
		showEndMessage("¡Felicidades, has ganado!");
	}
}

// muestra mensaje de ganar o perder
function showEndMessage(message) {
	const game = document.createElement("div");
	game.id = "seAcabo";
	game.innerText = message;

	document.body.appendChild(game);

	const attackButton = document.getElementById("attackButton");
	if (attackButton) {
		attackButton.disabled = true;
	}
}
