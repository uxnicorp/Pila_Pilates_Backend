const jwt = require('jsonwebtoken');

//se encarga de ver que el tokene ste vigente o expiro
const validarJWT = (req, res, next) => {
	//x-token headers
	const token = req.header('x-token');

	if (!token) {
		console.log('❌ validarJWT: No hay token en la petición');
		return res.status(401).json({
			ok: false,
			msg: 'No hay token en la peticion',
		});
	}

	try {
		const payload = jwt.verify(token, process.env.SECRET_JWT);
		console.log('✅ validarJWT: Token válido para usuario:', payload.id, payload.userName);

		req.id = payload.id;
		req.userName = payload.userName;
		req.rol = payload.rol; // Añadimos el rol para que controllers puedan distinguir permisos
	} catch (error) {
		console.log('❌ validarJWT: Token inválido:', error.message);
		return res.status(401).json({
			ok: false,
			msg: 'token no valido',
		});
	}

	next();
};

module.exports = {
	validarJWT,
};