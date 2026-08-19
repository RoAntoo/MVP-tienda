import nodemailer from 'nodemailer';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Producto } from '../../dominio/entidades/producto.js';
import { Orden } from '../../dominio/entidades/orden.js';
import { Prisma } from '@prisma/client';
import { generarTokenAprobacion } from '../seguridad/tokens.js';
import escapeHtml from 'escape-html';
import { ProductoNovedad, PromocionNovedad } from '../../dominio/entidades/novedad.js';
import { RepositorioSuscriptores } from '../../dominio/repositorios/repositorio-suscriptores.js';
import { ResultadoEnvioNovedad } from '../../dominio/servicios/servicio-email.js';

function getSafeUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href.replace(/\/$/, '');
    }
  } catch (e) {
    // Ignorar URLs inválidas
  }
  return '#'; // Fallback seguro
}

export class ServicioEmailNodemailer implements ServicioEmail {
  private transporter: nodemailer.Transporter;

  constructor(
    usuario: string,
    pass: string,
    private repositorioSuscriptores: RepositorioSuscriptores,
    private apiKey: string = '',
    private backendUrl: string = 'http://localhost:3000',
    private frontendUrl: string = 'http://localhost:5173',
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Por defecto usamos Gmail
      auth: {
        user: usuario,
        pass: pass,
      },
      connectionTimeout: 5000,
      socketTimeout: 5000,
    });
  }

  async enviarInstruccionesPago(emailCliente: string, total: Prisma.Decimal | number, cantidad: number): Promise<void> {
    const safeTotal = escapeHtml(total.toString());
    const safeCantidad = escapeHtml(cantidad.toString());

    const htmlContent = `
      <div style="font-family: monospace; color: #f0f0f0; background: #0d0d12; padding: 20px;">
        <h2 style="color: #00f0ff;">> EbooksPack</h2>
        <p>¡Hola! Has iniciado la compra de <strong>${safeCantidad} libro(s)</strong> por un total de <strong style="color: #ff2a85;">$${safeTotal}</strong>.</p>
        <div style="border: 1px solid #00f0ff; padding: 15px; margin: 20px 0;">
          <h3 style="color: #00f0ff; margin-top: 0;">DATOS PARA EL PAGO</h3>
          <p>Por favor, deposita o transfiere a esta cuenta bancaria:</p>
          <ul>
            <li><strong>CBU:</strong> 1430001713025690150015</li>
            <li><strong>Alias:</strong> ebookspack-bru</li>
            <li><strong>Nombre:</strong> Rocio Antonella</li>
          </ul>
        </div>
        <p>Una vez que recibamos el pago (y nos envíes el comprobante a este correo si lo deseas), aprobaremos tu orden y te llegarán automáticamente los links de descarga.</p>
        <p style="color: #a0a0b0;">© 2026 EbooksPack</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"EbooksPack" <no-reply@ebookspack.com>',
      to: emailCliente,
      subject: 'Instrucciones para pagar tu compra',
      html: htmlContent,
    });
  }

  async enviarLinksDescarga(emailCliente: string, productos: Producto[]): Promise<void> {
    const listaProductosHTML = productos.map(p => `
      <li style="margin-bottom: 10px;">
        <strong>${escapeHtml(p.titulo)}</strong><br/>
        <a href="${escapeHtml(getSafeUrl(p.driveUrl || ''))}" style="color: #ff2a85; text-decoration: none;">[ DESCARGAR_ARCHIVO ]</a>
      </li>
    `).join('');

    const htmlContent = `
      <div style="font-family: monospace; color: #f0f0f0; background: #0d0d12; padding: 20px;">
        <h2 style="color: #00f0ff;">> PAGO_CONFIRMADO</h2>
        <p>¡Tu pago ha sido validado con éxito! Aquí tienes los archivos listos para descargar:</p>
        <ul style="list-style: none; padding-left: 0; border-left: 2px solid #00f0ff; padding-left: 15px;">
          ${listaProductosHTML}
        </ul>
        <p>Gracias por tu compra❤️.</p>
        <p style="color: #a0a0b0;">© 2026 EbooksPack</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"EbooksPack" <no-reply@ebookspack.com>',
      to: emailCliente,
      subject: '¡Tus libros están listos para descargar!',
      html: htmlContent,
    });
  }

  async notificarNuevaOrdenAdmin(emailAdmin: string, orden: Orden, productos: Producto[]): Promise<void> {
    const safeEmailCliente = escapeHtml(orden.emailCliente);
    const safeTotal = escapeHtml(orden.total.toString());
    const safeId = escapeHtml(orden.id);
    const safeBackendUrl = getSafeUrl(this.backendUrl);

    const listaProductosHTML = productos.map(p => `<li>- ${escapeHtml(p.titulo)} ($${escapeHtml(p.precio.toString())})</li>`).join('');
    const token = generarTokenAprobacion(orden.id, this.apiKey);

    const htmlContent = `
      <div style="font-family: monospace; color: #f0f0f0; background: #0d0d12; padding: 20px;">
        <h2 style="color: #ff2a85;">> ALERTA_NUEVA_VENTA</h2>
        <p>¡El sistema ha registrado una nueva orden de compra!</p>
        <div style="border: 1px solid #ff2a85; padding: 15px; margin: 20px 0;">
          <h3 style="color: #ff2a85; margin-top: 0;">DATOS DE LA ORDEN #${safeId.substring(0, 8)}</h3>
          <ul>
            <li><strong>Cliente:</strong> ${safeEmailCliente}</li>
            <li><strong>Total a recibir:</strong> $${safeTotal}</li>
          </ul>
          <h4>Libros solicitados:</h4>
          <ul style="list-style: none; padding-left: 0; border-left: 2px solid #ff2a85; padding-left: 15px;">
            ${listaProductosHTML}
          </ul>
        </div>
        <p>Revisa tu cuenta bancaria. Si el pago ingresó correctamente, haz clic en el siguiente botón para aprobar la orden instantáneamente:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(safeBackendUrl)}/admin/ordenes/aprobar-magico?ordenId=${safeId}&token=${escapeHtml(token)}" 
             style="background-color: #ff2a85; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block; font-size: 16px;">
            [ CONFIRMAR Y LIBERAR LIBROS ]
          </a>
        </div>
        
        <p style="color: #a0a0b0;">© 2026 EbooksPack Admin System</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"EbooksPack System" <no-reply@ebookspack.com>',
      to: emailAdmin,
      subject: `Nueva orden de compra - $${safeTotal}`,
      html: htmlContent,
    });
  }
  async enviarSolicitudLibros(emailAdmin: string, emailCliente: string, mensaje: string, backendUrl: string, solicitudId: string): Promise<void> {
    const safeEmailCliente = escapeHtml(emailCliente);
    const safeMensaje = escapeHtml(mensaje);
    const safeBackendUrl = getSafeUrl(backendUrl);

    // Generar token usando solicitudId para asegurar la respuesta
    const token = generarTokenAprobacion(solicitudId, this.apiKey);

    const htmlContent = `
      <div style="font-family: monospace; color: #f0f0f0; background: #0d0d12; padding: 20px;">
        <h2 style="color: #ff2a85;">> NUEVA_SOLICITUD_LIBROS</h2>
        <p>Un cliente está buscando libros que no encontró en el catálogo.</p>
        <div style="border: 1px solid #00f0ff; padding: 15px; margin: 20px 0;">
          <h3 style="color: #00f0ff; margin-top: 0;">DATOS DE LA SOLICITUD</h3>
          <ul>
            <li><strong>Cliente:</strong> ${safeEmailCliente}</li>
          </ul>
          <h4>Mensaje / Libros buscados:</h4>
          <p style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 4px;">
            ${safeMensaje}
          </p>
        </div>
        
        <p>¿Tienes estos libros disponibles? Responde rápidamente con un clic:</p>
        
        <div style="text-align: center; margin: 30px 0; display: flex; gap: 10px; justify-content: center;">
          <a href="${escapeHtml(safeBackendUrl)}/admin/solicitudes/responder?solicitudId=${encodeURIComponent(solicitudId)}&existe=true&token=${escapeHtml(token)}" 
             style="background-color: #00f0ff; color: #0d0d12; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
            [ SÍ, LOS TENEMOS ]
          </a>
          <a href="${escapeHtml(safeBackendUrl)}/admin/solicitudes/responder?solicitudId=${encodeURIComponent(solicitudId)}&existe=false&token=${escapeHtml(token)}" 
             style="background-color: #ff2a85; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
            [ NO, RECHAZAR ]
          </a>
        </div>
        
        <p style="color: #a0a0b0;">© 2026 EbooksPack Admin System</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"EbooksPack System" <no-reply@ebookspack.com>',
      to: emailAdmin,
      replyTo: emailCliente,
      subject: `Nueva solicitud de libros de ${safeEmailCliente}`,
      html: htmlContent,
    });
  }

  async enviarRespuestaSolicitud(emailCliente: string, mensajeOriginal: string, existe: boolean): Promise<void> {
    const safeMensajeOriginal = escapeHtml(mensajeOriginal);
    const color = existe ? '#00f0ff' : '#ff2a85';
    const titulo = existe ? '¡EXCELENTES NOTICIAS!' : 'LO SENTIMOS...';
    const mensaje = existe
      ? '¡Buenas noticias! Tenemos los libros que pediste. Necesitamos un ratito para cargarlos en la web (un día como máximo), pero no te preocupes: te enviaremos un correo apenas estén listos en EbooksPack para que puedas disfrutarlos.'
      : 'Lamentablemente no contamos con los libros que solicitaste en este momento. Hemos guardado tu sugerencia para el futuro.';

    const htmlContent = `
      <div style="font-family: monospace; color: #f0f0f0; background: #0d0d12; padding: 20px;">
        <h2 style="color: ${color};">> ${titulo}</h2>
        <p>Hola,</p>
        <p>${mensaje}</p>
        
        <div style="border: 1px solid rgba(255,255,255,0.2); padding: 15px; margin: 20px 0;">
          <h4 style="color: #a0a0b0; margin-top: 0;">Tu solicitud original:</h4>
          <p style="font-style: italic; color: #d0d0d0;">"${safeMensajeOriginal}"</p>
        </div>
        
        <p>¡Gracias por usar EbooksPack!</p>
        <p style="color: #a0a0b0;">© 2026 EbooksPack System</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"EbooksPack Team" <no-reply@ebookspack.com>',
      to: emailCliente,
      subject: existe ? '¡Tenemos los libros que buscabas!' : 'Sobre tu solicitud de libros en EbooksPack',
      html: htmlContent,
    });
  }

  async enviarAvisoSubidaLibro(emailCliente: string, mensajeOriginal: string): Promise<void> {
    const safeMensajeOriginal = escapeHtml(mensajeOriginal);

    const htmlContent = `
      <div style="font-family: monospace; color: #f0f0f0; background: #0d0d12; padding: 20px;">
        <h2 style="color: #00f0ff;">> ¡NOTICIA_CATÁLOGO!</h2>
        <p>Hola,</p>
        <p>¡Buenas noticias! Los libros que nos pediste ya fueron subidos a EbooksPack. Puedes ingresar a la tienda y buscarlos ahora mismo.</p>
        
        <div style="border: 1px solid rgba(255,255,255,0.2); padding: 15px; margin: 20px 0;">
          <h4 style="color: #a0a0b0; margin-top: 0;">Tu solicitud original:</h4>
          <p style="font-style: italic; color: #d0d0d0;">"${safeMensajeOriginal}"</p>
        </div>
        
        <p>¡Gracias por usar EbooksPack y sugerir contenido!</p>
        <p style="color: #a0a0b0;">© 2026 EbooksPack System</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: '"EbooksPack Team" <no-reply@ebookspack.com>',
      to: emailCliente,
      subject: '¡Los libros que pediste ya están disponibles!',
      html: htmlContent,
    });
  }

  private async getUnsubscribeUrl(email: string): Promise<string> {
    const token = await this.repositorioSuscriptores.generarTokenBaja(email, this.apiKey);
    return `${getSafeUrl(this.backendUrl)}/suscripciones/baja?token=${encodeURIComponent(token)}`;
  }

  async enviarNovedadCatalogo(emailCliente: string, asunto: string, mensaje: string, productos: ProductoNovedad[]): Promise<ResultadoEnvioNovedad> {
    const unsubscribeUrl = await this.getUnsubscribeUrl(emailCliente);
    const catalogUrl = getSafeUrl(this.frontendUrl);
    const listaProductosHTML = productos.map(producto => {
      const imagenUrl = getSafeUrl(producto.imagenUrl);
      const titulo = escapeHtml(producto.titulo);
      const categoria = escapeHtml(producto.categoria || 'General');
      const precio = escapeHtml(producto.precio.toLocaleString('es-AR'));

      return `
        <tr>
          <td style="padding: 0 0 16px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #2d3748; background: #111827;">
              <tr>
                <td width="112" valign="top" style="padding: 12px;">
                  <img src="${escapeHtml(imagenUrl)}" width="104" height="150" alt="Portada de ${titulo}" style="display: block; width: 104px; height: 150px; object-fit: cover; border: 1px solid #00f0ff; border-radius: 8px; background: #09090b;" />
                </td>
                <td valign="middle" style="padding: 16px 16px 16px 4px;">
                  <p style="margin: 0 0 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">${categoria}</p>
                  <h3 style="margin: 0 0 14px 0; color: #f8fafc; font-family: Arial, Helvetica, sans-serif; font-size: 20px; line-height: 1.25;">${titulo}</h3>
                  <p style="margin: 0; color: #ff2a85; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold;">$${precio}</p>
                  <p style="margin: 8px 0 0 0; color: #94a3b8; font-family: Arial, Helvetica, sans-serif; font-size: 12px;">Disponible en formato digital.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!doctype html>
      <html lang="es">
        <body style="margin: 0; padding: 0; background: transparent; color: #f8fafc;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background: transparent;">
            <tr>
              <td align="center" style="padding: 24px 12px;">
                <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 640px; background: #0b1018; border: 1px solid #243244; border-radius: 18px; overflow: hidden;">
                  <tr>
                    <td style="padding: 28px 28px 22px 28px; border-bottom: 3px solid #ff2a85; background: linear-gradient(135deg, #101a2b, #0b1018 70%);">
                      <p style="margin: 0 0 14px 0; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px;">EBOOKSPACK / ACTUALIZACIÓN_DE_CATÁLOGO</p>
                      <h1 style="margin: 0; color: #f8fafc; font-family: Arial, Helvetica, sans-serif; font-size: 32px; line-height: 1.12;">Nuevas lecturas<br/><span style="color: #00f0ff;">detectadas.</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 26px 28px 10px 28px;">
                      <p style="margin: 0; color: #e2e8f0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6;">${escapeHtml(mensaje)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 28px 8px 28px;">
                      <p style="margin: 0 0 14px 0; color: #94a3b8; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">&gt; NUEVAS_ENTRADAS</p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        ${listaProductosHTML}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 14px 28px 30px 28px;">
                      <a href="${escapeHtml(catalogUrl)}" style="display: inline-block; padding: 14px 22px; background: #ff2a85; border: 1px solid #ff2a85; border-radius: 9px; color: #ffffff; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-decoration: none;">EXPLORAR CATÁLOGO &gt;</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px 28px; border-top: 1px solid #243244; background: #080c12;">
                      <p style="margin: 0 0 8px 0; color: #64748b; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.5;">Recibís este email porque te suscribiste a las novedades de EbooksPack.</p>
                      <a href="${escapeHtml(unsubscribeUrl)}" style="color: #94a3b8; font-family: Arial, Helvetica, sans-serif; font-size: 11px;">Dejar de recibir novedades</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const info = await this.transporter.sendMail({
      from: '"EbooksPack Team" <no-reply@ebookspack.com>',
      to: emailCliente,
      subject: asunto,
      html: htmlContent,
    });
    return { aceptado: true, referencia: info.messageId };
  }

  async enviarNovedadPromocion(emailCliente: string, asunto: string, mensaje: string, promociones: PromocionNovedad[]): Promise<ResultadoEnvioNovedad> {
    const unsubscribeUrl = await this.getUnsubscribeUrl(emailCliente);
    const catalogUrl = getSafeUrl(this.frontendUrl);
    const listaPromocionesHTML = promociones.map(promocion => {
      const esPorcentaje = promocion.tipo === 'PORCENTAJE';
      const valor = esPorcentaje
        ? `${promocion.valor}% OFF`
        : `$${promocion.valor.toLocaleString('es-AR')} por archivo`;
      const tipo = esPorcentaje ? 'DESCUENTO PORCENTUAL' : 'PRECIO ESPECIAL POR ARCHIVO';
      const vencimiento = promocion.fechaFin
        ? `Válida hasta ${promocion.fechaFin.toLocaleDateString('es-AR')}`
        : 'Sin fecha de vencimiento';

      return `
        <tr>
          <td style="padding: 0 0 16px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #4b263d; border-radius: 12px; overflow: hidden; background: #17111a;">
              <tr>
                <td width="92" valign="middle" align="center" style="padding: 18px 10px; border-right: 1px solid #4b263d;">
                  <p style="margin: 0 0 8px 0; color: #ff7eaf; font-family: 'Courier New', monospace; font-size: 10px; font-weight: bold; letter-spacing: 1px;">PROMO</p>
                  <p style="margin: 0; color: #ff2a85; font-family: 'Courier New', monospace; font-size: 22px; font-weight: bold; line-height: 1.1;">${escapeHtml(valor)}</p>
                </td>
                <td valign="middle" style="padding: 18px 18px;">
                  <p style="margin: 0 0 8px 0; color: #00f0ff; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 1px;">${escapeHtml(tipo)}</p>
                  <h3 style="margin: 0 0 10px 0; color: #f8fafc; font-family: Arial, Helvetica, sans-serif; font-size: 19px; line-height: 1.25;">${escapeHtml(promocion.nombre)}</h3>
                  <p style="margin: 0; color: #94a3b8; font-family: Arial, Helvetica, sans-serif; font-size: 12px;">${escapeHtml(vencimiento)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!doctype html>
      <html lang="es">
        <body style="margin: 0; padding: 0; background: transparent; color: #f8fafc;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background: transparent;">
            <tr>
              <td align="center" style="padding: 24px 12px;">
                <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 640px; background: #0b1018; border: 1px solid #243244; border-radius: 18px; overflow: hidden;">
                  <tr>
                    <td style="padding: 28px 28px 22px 28px; border-bottom: 3px solid #00f0ff; background: linear-gradient(135deg, #241126, #0b1018 70%);">
                      <p style="margin: 0 0 14px 0; color: #ff7eaf; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px;">EBOOKSPACK / SEÑAL_DE_PROMOCIONES</p>
                      <h1 style="margin: 0; color: #f8fafc; font-family: Arial, Helvetica, sans-serif; font-size: 32px; line-height: 1.12;">Algo especial<br/><span style="color: #ff2a85;">te está esperando.</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 26px 28px 10px 28px;">
                      <p style="margin: 0; color: #e2e8f0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6;">${escapeHtml(mensaje)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 28px 8px 28px;">
                      <p style="margin: 0 0 14px 0; color: #94a3b8; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">&gt; OFERTAS_ACTIVAS</p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        ${listaPromocionesHTML}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 14px 28px 30px 28px;">
                      <a href="${escapeHtml(catalogUrl)}" style="display: inline-block; padding: 14px 22px; background: #ff2a85; border: 1px solid #ff2a85; border-radius: 9px; color: #ffffff; font-family: 'Courier New', monospace; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-decoration: none;">VER OFERTAS &gt;</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 18px 28px; border-top: 1px solid #243244; background: #080c12;">
                      <p style="margin: 0 0 8px 0; color: #64748b; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.5;">Recibís este email porque te suscribiste a las novedades de EbooksPack.</p>
                      <a href="${escapeHtml(unsubscribeUrl)}" style="color: #94a3b8; font-family: Arial, Helvetica, sans-serif; font-size: 11px;">Dejar de recibir novedades</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const info = await this.transporter.sendMail({
      from: '"EbooksPack Team" <no-reply@ebookspack.com>',
      to: emailCliente,
      subject: asunto,
      html: htmlContent,
    });
    return { aceptado: true, referencia: info.messageId };
  }
}
