package com.condocompare.common.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "condocompare.documents";
    public static final String QUEUE_PROCESS = "condocompare.documents.process";
    public static final String ROUTING_KEY_UPLOADED = "document.uploaded";

    @Bean
    public TopicExchange documentExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue documentProcessQueue() {
        return QueueBuilder.durable(QUEUE_PROCESS)
                .withArgument("x-dead-letter-exchange", EXCHANGE + ".dlx")
                .withArgument("x-dead-letter-routing-key", "document.failed")
                .build();
    }

    @Bean
    public Queue documentDeadLetterQueue() {
        return QueueBuilder.durable(QUEUE_PROCESS + ".dlq").build();
    }

    @Bean
    public TopicExchange documentDeadLetterExchange() {
        return new TopicExchange(EXCHANGE + ".dlx", true, false);
    }

    @Bean
    public Binding documentProcessBinding(Queue documentProcessQueue, TopicExchange documentExchange) {
        return BindingBuilder.bind(documentProcessQueue).to(documentExchange).with(ROUTING_KEY_UPLOADED);
    }

    @Bean
    public Binding documentDeadLetterBinding(Queue documentDeadLetterQueue, TopicExchange documentDeadLetterExchange) {
        return BindingBuilder.bind(documentDeadLetterQueue).to(documentDeadLetterExchange).with("document.failed");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
