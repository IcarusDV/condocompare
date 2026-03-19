package com.condocompare.common.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@condocompare.com.br}")
    private String fromEmail;

    @Value("${app.mail.name:CondoCompare}")
    private String fromName;

    @Async
    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email enviado para: {}", to);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Erro ao enviar email para {}: {}", to, e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String name, String resetLink) {
        String subject = "CondoCompare - Redefinicao de Senha";
        String html = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
              <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #0f172a, #1e3a5f); padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">CondoCompare</h1>
                  <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 12px; letter-spacing: 1px;">PLATAFORMA DE SEGURO CONDOMINIAL</p>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 20px;">Redefinicao de Senha</h2>
                  <p style="color: #64748b; line-height: 1.6;">Ola <strong>%s</strong>,</p>
                  <p style="color: #64748b; line-height: 1.6;">Recebemos uma solicitacao para redefinir a senha da sua conta. Clique no botao abaixo para criar uma nova senha:</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="%s" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">Redefinir Senha</a>
                  </div>
                  <p style="color: #94a3b8; font-size: 13px; line-height: 1.6;">Este link expira em <strong>1 hora</strong>. Se voce nao solicitou a redefinicao, ignore este email.</p>
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                  <p style="color: #cbd5e1; font-size: 12px; text-align: center;">CondoCompare &copy; 2026. Todos os direitos reservados.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, resetLink);
        sendEmail(to, subject, html);
    }

    public void sendWelcomeEmail(String to, String name) {
        String subject = "Bem-vindo ao CondoCompare!";
        String html = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
              <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #0f172a, #1e3a5f); padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">CondoCompare</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #1e293b; margin: 0 0 16px;">Bem-vindo, %s!</h2>
                  <p style="color: #64748b; line-height: 1.6;">Sua conta foi criada com sucesso. Agora voce pode:</p>
                  <ul style="color: #64748b; line-height: 2;">
                    <li>Importar e analisar documentos de seguro</li>
                    <li>Comparar orcamentos lado a lado</li>
                    <li>Receber diagnosticos inteligentes</li>
                    <li>Consultar o assistente de IA</li>
                  </ul>
                  <p style="color: #94a3b8; font-size: 13px;">Qualquer duvida, estamos aqui para ajudar.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(name);
        sendEmail(to, subject, html);
    }

    public void sendApoliceExpiringEmail(String to, String name, String condominioName, String seguradora, int diasRestantes) {
        String subject = "CondoCompare - Apolice vencendo em " + diasRestantes + " dias";
        String urgencyColor = diasRestantes <= 7 ? "#ef4444" : diasRestantes <= 15 ? "#f59e0b" : "#3b82f6";
        String html = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
              <div style="max-width: 560px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #0f172a, #1e3a5f); padding: 32px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">CondoCompare</h1>
                </div>
                <div style="padding: 32px;">
                  <div style="background: %s; color: white; padding: 12px 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                    <strong>Apolice vence em %d dias</strong>
                  </div>
                  <p style="color: #64748b; line-height: 1.6;">Ola <strong>%s</strong>,</p>
                  <p style="color: #64748b; line-height: 1.6;">A apolice do condominio <strong>%s</strong> (seguradora: <strong>%s</strong>) esta prestes a vencer.</p>
                  <p style="color: #64748b; line-height: 1.6;">Recomendamos iniciar o processo de renovacao o quanto antes.</p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(urgencyColor, diasRestantes, name, condominioName, seguradora);
        sendEmail(to, subject, html);
    }
}
