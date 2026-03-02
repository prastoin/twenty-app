
import {
  Field,
  FieldType,
  Object,
} from 'twenty-sdk';

@Object({
  universalIdentifier: '54b589ca-eeed-4950-a176-358418b85c05',
  nameSingular: 'postCard',
  namePlural: 'postCards',
  labelSingular: 'Post card',
  labelPlural: 'Post cards',
  description: ' A post card object',
  icon: 'IconMail',
})
export class PostCard {
  @Field({
    universalIdentifier: '58a0a314-d7ea-4865-9850-7fb84e72f30b',
    type: FieldType.TEXT,
    label: 'Content',
    description: "Postcard's content",
    icon: 'IconAbc',
  })
  content: string;
}
