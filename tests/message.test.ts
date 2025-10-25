import { describe, it, expect } from 'vitest';
import {
  MediaRef,
  AnnotationRef,
  TextBlock,
  ImageBlock,
  AudioBlock,
  VideoBlock,
  DocumentBlock,
  DataBlock,
  ToolCallBlock,
  RemoteToolCallBlock,
  ToolResultBlock,
  ReasoningBlock,
  AnnotationBlock,
  ErrorBlock,
  TokenUsages,
  Message
} from '../src/message';

describe('Message Classes Unit Tests', () => {
  describe('MediaRef', () => {
    it('should create MediaRef with url kind', () => {
      const media = new MediaRef('url', 'https://example.com/image.jpg');
      expect(media.kind).toBe('url');
      expect(media.url).toBe('https://example.com/image.jpg');
    });

    it('should create MediaRef with file_id kind', () => {
      const media = new MediaRef('file_id', undefined, 'file123');
      expect(media.kind).toBe('file_id');
      expect(media.file_id).toBe('file123');
    });

    it('should create MediaRef with data kind', () => {
      const media = new MediaRef('data', undefined, undefined, 'base64data');
      expect(media.kind).toBe('data');
      expect(media.data_base64).toBe('base64data');
    });

    it('should create MediaRef with all properties', () => {
      const media = new MediaRef(
        'url',
        'https://example.com/video.mp4',
        undefined,
        undefined,
        'video/mp4',
        1024000,
        'sha256hash',
        'video.mp4',
        1920,
        1080,
        60000
      );
      
      expect(media.mime_type).toBe('video/mp4');
      expect(media.size_bytes).toBe(1024000);
      expect(media.sha256).toBe('sha256hash');
      expect(media.filename).toBe('video.mp4');
      expect(media.width).toBe(1920);
      expect(media.height).toBe(1080);
      expect(media.duration_ms).toBe(60000);
    });
  });

  describe('AnnotationRef', () => {
    it('should create empty AnnotationRef', () => {
      const annotation = new AnnotationRef();
      expect(annotation.url).toBeUndefined();
      expect(annotation.file_id).toBeUndefined();
      expect(annotation.page).toBeUndefined();
    });

    it('should create AnnotationRef with all properties', () => {
      const annotation = new AnnotationRef(
        'https://example.com/doc.pdf',
        'file456',
        5,
        2,
        'Important Reference'
      );
      
      expect(annotation.url).toBe('https://example.com/doc.pdf');
      expect(annotation.file_id).toBe('file456');
      expect(annotation.page).toBe(5);
      expect(annotation.index).toBe(2);
      expect(annotation.title).toBe('Important Reference');
    });
  });

  describe('TextBlock', () => {
    it('should create empty TextBlock', () => {
      const block = new TextBlock();
      expect(block.type).toBe('text');
      expect(block.text).toBe('');
      expect(block.annotations).toEqual([]);
    });

    it('should create TextBlock with text', () => {
      const block = new TextBlock('Hello, world!');
      expect(block.type).toBe('text');
      expect(block.text).toBe('Hello, world!');
    });

    it('should create TextBlock with annotations', () => {
      const annotations = [
        new AnnotationRef('https://example.com', undefined, 1),
        new AnnotationRef(undefined, 'file123', 2)
      ];
      const block = new TextBlock('Cited text', annotations);
      
      expect(block.annotations).toHaveLength(2);
      expect(block.annotations[0].url).toBe('https://example.com');
      expect(block.annotations[1].file_id).toBe('file123');
    });
  });

  describe('ImageBlock', () => {
    it('should create ImageBlock with media', () => {
      const media = new MediaRef('url', 'https://example.com/image.jpg');
      const block = new ImageBlock(media);
      
      expect(block.type).toBe('image');
      expect(block.media.url).toBe('https://example.com/image.jpg');
    });

    it('should create ImageBlock with alt text and bbox', () => {
      const media = new MediaRef('url', 'https://example.com/image.jpg');
      const block = new ImageBlock(media, 'A beautiful sunset', [0, 0, 100, 100]);
      
      expect(block.alt_text).toBe('A beautiful sunset');
      expect(block.bbox).toEqual([0, 0, 100, 100]);
    });
  });

  describe('AudioBlock', () => {
    it('should create AudioBlock with media', () => {
      const media = new MediaRef('url', 'https://example.com/audio.mp3');
      const block = new AudioBlock(media);
      
      expect(block.type).toBe('audio');
      expect(block.media.url).toBe('https://example.com/audio.mp3');
    });

    it('should create AudioBlock with transcript and metadata', () => {
      const media = new MediaRef('url', 'https://example.com/audio.mp3');
      const block = new AudioBlock(media, 'Hello world', 44100, 2);
      
      expect(block.transcript).toBe('Hello world');
      expect(block.sample_rate).toBe(44100);
      expect(block.channels).toBe(2);
    });
  });

  describe('VideoBlock', () => {
    it('should create VideoBlock with media', () => {
      const media = new MediaRef('url', 'https://example.com/video.mp4');
      const block = new VideoBlock(media);
      
      expect(block.type).toBe('video');
      expect(block.media.url).toBe('https://example.com/video.mp4');
    });

    it('should create VideoBlock with thumbnail', () => {
      const media = new MediaRef('url', 'https://example.com/video.mp4');
      const thumbnail = new MediaRef('url', 'https://example.com/thumb.jpg');
      const block = new VideoBlock(media, thumbnail);
      
      expect(block.thumbnail).toBeDefined();
      expect(block.thumbnail?.url).toBe('https://example.com/thumb.jpg');
    });
  });

  describe('DocumentBlock', () => {
    it('should create DocumentBlock with media', () => {
      const media = new MediaRef('url', 'https://example.com/doc.pdf');
      const block = new DocumentBlock(media);
      
      expect(block.type).toBe('document');
      expect(block.media.url).toBe('https://example.com/doc.pdf');
    });

    it('should create DocumentBlock with pages and excerpt', () => {
      const media = new MediaRef('url', 'https://example.com/doc.pdf');
      const block = new DocumentBlock(media, [1, 2, 3], 'Document excerpt');
      
      expect(block.pages).toEqual([1, 2, 3]);
      expect(block.excerpt).toBe('Document excerpt');
    });
  });

  describe('DataBlock', () => {
    it('should create DataBlock with mime type', () => {
      const block = new DataBlock('application/json');
      expect(block.type).toBe('data');
      expect(block.mime_type).toBe('application/json');
    });

    it('should create DataBlock with base64 data', () => {
      const block = new DataBlock('application/json', 'eyJ0ZXN0IjoidmFsdWUifQ==');
      expect(block.data_base64).toBe('eyJ0ZXN0IjoidmFsdWUifQ==');
    });

    it('should create DataBlock with media reference', () => {
      const media = new MediaRef('url', 'https://example.com/data.json');
      const block = new DataBlock('application/json', undefined, media);
      
      expect(block.media).toBeDefined();
      expect(block.media?.url).toBe('https://example.com/data.json');
    });
  });

  describe('ToolCallBlock', () => {
    it('should create ToolCallBlock with required fields', () => {
      const block = new ToolCallBlock('call_123', 'get_weather');
      expect(block.type).toBe('tool_call');
      expect(block.id).toBe('call_123');
      expect(block.name).toBe('get_weather');
      expect(block.args).toEqual({});
    });

    it('should create ToolCallBlock with args', () => {
      const args = { location: 'New York', units: 'celsius' };
      const block = new ToolCallBlock('call_123', 'get_weather', args);
      
      expect(block.args).toEqual(args);
    });

    it('should create ToolCallBlock with tool_type', () => {
      const block = new ToolCallBlock('call_123', 'get_weather', {}, 'remote');
      expect(block.tool_type).toBe('remote');
    });
  });

  describe('RemoteToolCallBlock', () => {
    it('should create RemoteToolCallBlock with defaults', () => {
      const block = new RemoteToolCallBlock('call_456', 'send_email');
      expect(block.type).toBe('remote_tool_call');
      expect(block.id).toBe('call_456');
      expect(block.name).toBe('send_email');
      expect(block.tool_type).toBe('remote');
    });

    it('should create RemoteToolCallBlock with custom tool_type', () => {
      const block = new RemoteToolCallBlock('call_456', 'send_email', {}, 'api');
      expect(block.tool_type).toBe('api');
    });
  });

  describe('ToolResultBlock', () => {
    it('should create successful ToolResultBlock', () => {
      const block = new ToolResultBlock({
        call_id: 'call_123',
        output: { temperature: 72, condition: 'sunny' },
        status: 'completed',
        is_error: false
      });
      
      expect(block.type).toBe('tool_result');
      expect(block.call_id).toBe('call_123');
      expect(block.output).toEqual({ temperature: 72, condition: 'sunny' });
      expect(block.status).toBe('completed');
      expect(block.is_error).toBe(false);
    });

    it('should create failed ToolResultBlock', () => {
      const block = new ToolResultBlock({
        call_id: 'call_456',
        output: { error: 'API timeout' },
        status: 'failed',
        is_error: true
      });
      
      expect(block.status).toBe('failed');
      expect(block.is_error).toBe(true);
      expect(block.output.error).toBe('API timeout');
    });
  });

  describe('ReasoningBlock', () => {
    it('should create ReasoningBlock with summary', () => {
      const block = new ReasoningBlock('Analyzing data');
      expect(block.type).toBe('reasoning');
      expect(block.summary).toBe('Analyzing data');
    });

    it('should create ReasoningBlock with details', () => {
      const details = ['Step 1: Parse input', 'Step 2: Validate', 'Step 3: Process'];
      const block = new ReasoningBlock('Processing request', details);
      
      expect(block.details).toEqual(details);
    });
  });

  describe('AnnotationBlock', () => {
    it('should create citation AnnotationBlock', () => {
      const refs = [new AnnotationRef('https://example.com', undefined, 1)];
      const block = new AnnotationBlock('citation', refs);
      
      expect(block.type).toBe('annotation');
      expect(block.kind).toBe('citation');
      expect(block.refs).toHaveLength(1);
    });

    it('should create note AnnotationBlock with spans', () => {
      const refs = [new AnnotationRef(undefined, 'file123')];
      const spans: [number, number][] = [[0, 10], [20, 30]];
      const block = new AnnotationBlock('note', refs, spans);
      
      expect(block.kind).toBe('note');
      expect(block.spans).toEqual(spans);
    });
  });

  describe('ErrorBlock', () => {
    it('should create ErrorBlock with message', () => {
      const block = new ErrorBlock('Something went wrong');
      expect(block.type).toBe('error');
      expect(block.message).toBe('Something went wrong');
    });

    it('should create ErrorBlock with code and data', () => {
      const block = new ErrorBlock('Network error', 'NET_ERR', { timeout: 5000 });
      
      expect(block.code).toBe('NET_ERR');
      expect(block.data).toEqual({ timeout: 5000 });
    });
  });

  describe('TokenUsages', () => {
    it('should create TokenUsages with default values', () => {
      const usage = new TokenUsages();
      expect(usage.completion_tokens).toBe(0);
      expect(usage.prompt_tokens).toBe(0);
      expect(usage.total_tokens).toBe(0);
      expect(usage.reasoning_tokens).toBe(0);
    });
  });

  describe('Message', () => {
    describe('constructor', () => {
      it('should create user message', () => {
        const content = [new TextBlock('Hello')];
        const message = new Message('user', content);
        
        expect(message.role).toBe('user');
        expect(message.content).toHaveLength(1);
        expect(message.delta).toBe(false);
      });

      it('should create message with id', () => {
        const content = [new TextBlock('Hello')];
        const message = new Message('user', content, 'msg_123');
        
        expect(message.message_id).toBe('msg_123');
      });
    });

    describe('text_message', () => {
      it('should create user text message', () => {
        const message = Message.text_message('Hello, world!');
        
        expect(message.role).toBe('user');
        expect(message.content).toHaveLength(1);
        expect(message.content[0].type).toBe('text');
        expect((message.content[0] as TextBlock).text).toBe('Hello, world!');
      });

      it('should create assistant text message', () => {
        const message = Message.text_message('How can I help?', 'assistant');
        expect(message.role).toBe('assistant');
      });

      it('should create system text message', () => {
        const message = Message.text_message('You are a helpful assistant', 'system');
        expect(message.role).toBe('system');
      });

      it('should create text message with id', () => {
        const message = Message.text_message('Hello', 'user', 'msg_456');
        expect(message.message_id).toBe('msg_456');
      });
    });

    describe('tool_message', () => {
      it('should create tool message', () => {
        const result = new ToolResultBlock({
          call_id: 'call_123',
          output: { result: 'success' },
          status: 'completed',
          is_error: false
        });
        
        const message = Message.tool_message([result]);
        
        expect(message.role).toBe('tool');
        expect(message.content).toHaveLength(1);
        expect(message.content[0].type).toBe('tool_result');
      });

      it('should create tool message with metadata', () => {
        const result = new ToolResultBlock({
          call_id: 'call_123',
          output: { result: 'success' },
          status: 'completed',
          is_error: false
        });
        
        const meta = { execution_time: 150 };
        const message = Message.tool_message([result], 'msg_789', meta);
        
        expect(message.metadata).toEqual(meta);
        expect(message.message_id).toBe('msg_789');
      });
    });

    describe('text()', () => {
      it('should extract text from TextBlock', () => {
        const message = Message.text_message('Hello, world!');
        expect(message.text()).toBe('Hello, world!');
      });

      it('should extract text from multiple TextBlocks', () => {
        const message = new Message('user', [
          new TextBlock('Hello'),
          new TextBlock(' '),
          new TextBlock('world')
        ]);
        expect(message.text()).toBe('Hello world');
      });

      it('should extract text from ToolResultBlock with string output', () => {
        const result = new ToolResultBlock({
          call_id: 'call_123',
          output: 'Tool result text',
          status: 'completed',
          is_error: false
        });
        const message = new Message('tool', [result]);
        expect(message.text()).toBe('Tool result text');
      });

      it('should stringify ToolResultBlock with object output', () => {
        const result = new ToolResultBlock({
          call_id: 'call_123',
          output: { temp: 72, condition: 'sunny' },
          status: 'completed',
          is_error: false
        });
        const message = new Message('tool', [result]);
        expect(message.text()).toBe('{"temp":72,"condition":"sunny"}');
      });

      it('should return empty string for non-text blocks', () => {
        const image = new ImageBlock(new MediaRef('url', 'https://example.com/img.jpg'));
        const message = new Message('user', [image]);
        expect(message.text()).toBe('');
      });
    });

    describe('attach_media()', () => {
      it('should attach image media', () => {
        const message = Message.text_message('Check this out');
        const media = new MediaRef('url', 'https://example.com/image.jpg');
        
        message.attach_media(media, 'image');
        
        expect(message.content).toHaveLength(2);
        expect(message.content[1].type).toBe('image');
        expect((message.content[1] as ImageBlock).media.url).toBe('https://example.com/image.jpg');
      });

      it('should attach audio media', () => {
        const message = Message.text_message('Listen to this');
        const media = new MediaRef('url', 'https://example.com/audio.mp3');
        
        message.attach_media(media, 'audio');
        
        expect(message.content).toHaveLength(2);
        expect(message.content[1].type).toBe('audio');
      });

      it('should attach video media', () => {
        const message = Message.text_message('Watch this');
        const media = new MediaRef('url', 'https://example.com/video.mp4');
        
        message.attach_media(media, 'video');
        
        expect(message.content[1].type).toBe('video');
      });

      it('should attach document media', () => {
        const message = Message.text_message('Read this');
        const media = new MediaRef('url', 'https://example.com/doc.pdf');
        
        message.attach_media(media, 'document');
        
        expect(message.content[1].type).toBe('document');
      });

      it('should throw error for unsupported media type', () => {
        const message = Message.text_message('Test');
        const media = new MediaRef('url', 'https://example.com/file.txt');
        
        expect(() => {
          message.attach_media(media, 'unsupported' as any);
        }).toThrow('Unsupported media type: unsupported');
      });

      it('should attach multiple media items', () => {
        const message = Message.text_message('Multiple attachments');
        const image = new MediaRef('url', 'https://example.com/image.jpg');
        const audio = new MediaRef('url', 'https://example.com/audio.mp3');
        
        message.attach_media(image, 'image');
        message.attach_media(audio, 'audio');
        
        expect(message.content).toHaveLength(3);
        expect(message.content[1].type).toBe('image');
        expect(message.content[2].type).toBe('audio');
      });
    });
  });
});
