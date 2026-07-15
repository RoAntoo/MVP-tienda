import nodemailer from 'nodemailer';
import { ServicioEmail } from '../../dominio/servicios/servicio-email.js';
import { Producto } from '../../dominio/entidades/producto.js';
import { Orden } from '../../dominio/entidades/orden.js';
import { Prisma } from '@prisma/client';
import { generarTokenAprobacion } from '../seguridad/tokens.js';
import escapeHtml from 'escape-html';

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
    private apiKey: string = '', 
    private backendUrl: string = 'http://localhost:3000'
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
        <p>¡Tu pago ha sido validado con éxito! Aquí tienes los archivos encriptados listos para descargar:</p>
        <ul style="list-style: none; padding-left: 0; border-left: 2px solid #00f0ff; padding-left: 15px;">
          ${listaProductosHTML}
        </ul>
        <p>Gracias por tu compra.</p>
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
          <h3 style="color: #ff2a85; margin-top: 0;">DATOS DE LA ORDEN #${safeId.substring(0,8)}</h3>
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
}
