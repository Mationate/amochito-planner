import nodemailer from 'nodemailer';
import { Task } from '@/types';

// Configuración del transportador de correo
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // Puedes cambiar esto por otro proveedor
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App password para Gmail
    },
  });
};

// Función para formatear las tareas en HTML
const formatTasksHTML = (tasks: Task[]): string => {
  if (tasks.length === 0) {
    return `
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
        <p style="color: #6c757d; font-style: italic; text-align: center;">🎉 ¡No tienes tareas pendientes para hoy! Disfruta tu día libre.</p>
      </div>
    `;
  }

  const tasksByPriority = {
    high: tasks.filter(task => task.priority === 'high'),
    medium: tasks.filter(task => task.priority === 'medium'),
    low: tasks.filter(task => task.priority === 'low')
  };

  const priorityColors = {
    high: '#dc3545',
    medium: '#ffc107',
    low: '#28a745'
  };

  const priorityLabels = {
    high: '🔴 Alta Prioridad',
    medium: '🟡 Prioridad Media',
    low: '🟢 Prioridad Baja'
  };

  let html = '';

  Object.entries(tasksByPriority).forEach(([priority, priorityTasks]) => {
    if (priorityTasks.length > 0) {
      html += `
        <div style="margin-bottom: 25px;">
          <h3 style="color: ${priorityColors[priority as keyof typeof priorityColors]}; margin-bottom: 15px; font-size: 18px;">
            ${priorityLabels[priority as keyof typeof priorityLabels]} (${priorityTasks.length})
          </h3>
          <ul style="list-style: none; padding: 0;">
      `;
      
      priorityTasks.forEach(task => {
        const categoryEmoji = getCategoryEmoji(task.category);
        html += `
          <li style="
            background-color: #f8f9fa;
            border-left: 4px solid ${priorityColors[priority as keyof typeof priorityColors]};
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">${categoryEmoji}</span>
              <span style="font-weight: 500; color: #333;">${task.title}</span>
            </div>
            <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">
              Categoría: ${task.category.charAt(0).toUpperCase() + task.category.slice(1)}
            </div>
          </li>
        `;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
  });

  return html;
};

// Función para obtener emoji por categoría
const getCategoryEmoji = (category: string): string => {
  const categoryEmojis: { [key: string]: string } = {
    work: '💼',
    study: '📚',
    finance: '💰',
    health: '🏥',
    social: '👥',
    entertainment: '🎬',
    shopping: '🛒',
    travel: '✈️',
    personal: '👤',
    other: '📝'
  };
  return categoryEmojis[category] || '📝';
};

// Función principal para enviar el correo diario
export const sendDailyTaskEmail = async (tasks: Task[], recipientEmail: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tareas del Día</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📅 Tareas del Día</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${formattedDate}</p>
        </div>

        <div style="background-color: #fff; border-radius: 12px; padding: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${formatTasksHTML(tasks)}
        </div>

        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
          <p style="margin: 0; color: #6c757d; font-size: 14px;">💪 ¡Que tengas un día productivo!</p>
          <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 12px;">Este correo fue enviado automáticamente por tu Planificador Semanal</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `📅 Tus tareas para hoy - ${formattedDate}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado exitosamente a ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo:', error);
    return false;
  }
};

// Función para verificar la configuración de correo
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Configuración de correo verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en la configuración de correo:', error);
    return false;
  }
};