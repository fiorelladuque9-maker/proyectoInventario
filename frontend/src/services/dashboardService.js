import { categoriaService, productoService } from './catalogoService.js';
import { ordenService } from './compraService.js';
import { conteoService } from './conteoService.js';
import { almacenService, existenciaBajoMinimoService, movimientoService } from './inventarioService.js';
import { proveedorService } from './proveedorService.js';

// Todos los indicadores salen del campo `count` o de los resultados reales de la API.
// Las 9 consultas se lanzan en paralelo (Promise.all) para que el dashboard cargue rápido.
export async function cargarDashboard() {
    const [productos, categorias, proveedores, almacenes, enviadas, borradores, conteos, bajoMinimo, movimientos] = await Promise.all([
        productoService.listar({ activo: 'true' }),
        categoriaService.listar({ activa: 'true' }),
        proveedorService.listar({ activo: 'true' }),
        almacenService.listar({ activo: 'true' }),
        ordenService.listar({ estado: 'enviada' }),
        ordenService.listar({ estado: 'borrador' }),
        conteoService.listar({ estado: 'abierto' }),
        existenciaBajoMinimoService.listar(),
        movimientoService.listar({ ordering: '-creado_en' }),
    ]);
    return {
        productos: productos.count,
        categorias: categorias.count,
        proveedores: proveedores.count,
        almacenes: almacenes.count,
        ordenesEnviadas: enviadas.count,
        ordenesBorrador: borradores.count,
        conteosAbiertos: conteos.count,
        bajoMinimo: bajoMinimo.count,
        alertas: bajoMinimo.results.slice(0, 5),
        movimientos: movimientos.results.slice(0, 5),
    };
}
