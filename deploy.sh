#!/bin/bash
if ! command -v node &>/dev/null; then
	echo "Es necesario instalar node para esta aplicacion"
	exit 1
fi
cd pokemon/
npm install
npm run dev &
echo "Servidor cliente 1 encendido"
cd ../user/
npm install
npm run dev &
echo "Servidor cliente 2 encendido"
cd ../pokemon/src/pvp
node connect.cjs
echo "Servidor WebSocket encendido"
